# Wave 4 plan: real appraisal history (database migrations)

Status: **W4a built and rehearsed locally (2026-10-09), branch `feat/w4a-appraisal-history` in the backend repo, not pushed.** Migration A is applied to the LOCAL dev database only (backup taken). Nothing has touched production. Migration B is deliberately not applied or shipped yet.
Findings covered: DAT-005 (history), DAT-006 (locked periods), DAT-008 (unsafe deletes), DAT-007 (scoring config over time), DAT-009 (migration policy).
Written from the real schema and your local database (which you say is about the same as production).

## 1. What is wrong today, in one paragraph

An employee can have **one** assessment per skill for all time (`UNIQUE(employee_id, technology_id)`), and one Primary skill per competency for all time (`UNIQUE(employee_id, competency_id, type)`). When a new period starts and someone is re-assessed, the old row is **overwritten and re-tagged** with the new period, so the old year is lost. The year-on-year report can only show years that happen to have rows. Locking is enforced only in application code, and deleting a skill, competency or period silently cascades or nulls history.

## 2. Facts from your local data (read only)

| Fact | Value | Why it matters |
|---|---|---|
| Periods | 1 (CY2026, OPEN, active) | There is **no history to lose yet**; the backfill is trivial |
| Assessments | 1,663, all in CY2026 (1,624 approved, 39 draft) | Every row already has a period, none are null |
| Rows with null period or null competency | 0 | The new key and NOT NULL are safe locally |
| Active periods at once | 1 | The "only one active" index can be created |
| `domain_scores` | table exists, **0 rows, not used by any code** | Leave it alone (DAT-005 suggested adding a period to it; not needed) |
| `competency_scores` | 731 rows; read by reports, written only by the recompute | Keep as "current scores"; **no schema change needed** (see design 3.2) |
| Triggers in the database | 1 (CEFR scale lock) | A new trigger is additive |
| Other tables with a period | `comm_assessments`, `improvement_plans` | CEFR history already works (no unique key per period problem) |

**Production must be checked with the pre-flight queries in section 7 before anything runs.**

## 3. Design (my recommendation)

### 3.1 Skill assessments become one row per person, skill and period
- New unique key: `(employee_id, technology_id, appraisal_period_id)` and `(employee_id, competency_id, type, appraisal_period_id)`.
- `appraisal_period_id` becomes **NOT NULL** (after the pre-flight proves no nulls).
- Code stops re-tagging a row's period on update and approve. A new period creates a **new row**.
- **Only rows of the active period can be changed.** Rows of other periods are read-only (also enforced in the database, see 3.4).

### 3.2 Scores stay "current"; history is computed per period on read
- `competency_scores` keeps meaning "the current score". **Critical code change:** the recompute must read only the **current period's** rows. Today it reads every row of the person and skill, so after a second period exists it would **add old and new rows together and inflate scores**. A test for exactly this is mandatory (section 6).
- Old periods are scored from their own rows when a report asks (the year-on-year report already works this way and uses the shared scoring function).
- This avoids adding a period column to `competency_scores`/`domain_scores` (less change, less risk than DAT-005's suggestion).

### 3.3 New period starts with a copy of the last one (decision D6, my recommendation)
- When a period becomes OPEN and active and `auto_rollover_skills` is true, copy the previous period's **approved** rows into the new period, as approved (this matches the screen's own text: "Auto-Rollover Verified Baseline").
- All periods are kept (nothing is deleted).
- One transaction per rollover, idempotent (running it twice copies nothing twice), audited, and with a dry-run count shown first.

### 3.4 Database guards (DAT-006)
- Trigger: reject INSERT, UPDATE and DELETE on `skill_assessments` (and `comm_assessments`) when their period is LOCKED or ARCHIVED.
- Partial unique index: only **one** period can have `is_active = true`.
- Code: a period cannot go back from LOCKED/ARCHIVED to OPEN/DRAFT, and cannot be deleted while it has assessments.

### 3.5 Deletes become safe (DAT-008)
- Foreign keys from assessments to technology, competency, domain and period change from CASCADE/SET NULL to **RESTRICT**.
- Code: deleting a skill, tool, competency or period that is in use answers **409 "in use, deactivate it instead"** (the `is_active` flag already exists).

### 3.5 Scoring config over time (DAT-007) is a **separate, later release (W4b)**
- Add a nullable JSON column on the period holding the scoring settings at open/lock, and let old-period reports read it.
- It is additive but touches every score path, so it should not ship with the key change.

## 4. The migrations, in order (expand, then contract)

> SQL below is a **draft for review**, not run. Names follow the existing constraint names.

**Release 1.2.0, migration A: expand (safe, additive, fully reversible)**
```sql
-- 1. New period-aware keys (plain CREATE UNIQUE INDEX: Prisma runs a migration in a transaction, where CONCURRENTLY is not allowed; the table has ~1,700 rows)
CREATE UNIQUE INDEX skill_assessments_emp_tech_period_key
  ON skill_assessments (employee_id, technology_id, appraisal_period_id);
CREATE UNIQUE INDEX skill_assessments_emp_comp_type_period_key
  ON skill_assessments (employee_id, competency_id, type, appraisal_period_id);
-- 2. Only one active period
CREATE UNIQUE INDEX appraisal_periods_one_active ON appraisal_periods (is_active) WHERE is_active;
-- 3. Period is mandatory (only after pre-flight shows 0 NULLs)
ALTER TABLE skill_assessments ALTER COLUMN appraisal_period_id SET NOT NULL;
-- 4. Delete safety
ALTER TABLE skill_assessments DROP CONSTRAINT skill_assessments_technology_id_fkey,
  ADD CONSTRAINT skill_assessments_technology_id_fkey FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE RESTRICT;
-- (same pattern for competency, domain, appraisal_period; competency_scores keeps CASCADE for derived data)
-- 5. Locked-period guard (function + trigger, see 3.4)
```
The **old** keys stay in place during release 1.2.0, so the old and new code both work and nothing depends on the order of deployment.

**Rollback for A:** drop the new indexes and trigger, restore the old FK rules, drop NOT NULL. No data was changed, so this is safe at any time.

**Release 1.2.x, migration B: contract (the point of no return)**
```sql
DROP INDEX skill_assessments_employee_id_technology_id_key;
DROP INDEX skill_assessments_employee_id_competency_id_type_key;
```
Run **only** immediately before the next period (for example CY2027) is opened, because from the first rollover on there are two rows per person and skill, and the old keys could never be restored. Before B: a verified production backup and your explicit go.

**Rollback for B:** only possible before any second-period row exists. After the first rollover, the fix is forward only (this is why B is separate and late).

## 5. Code changes (small, each with tests first)

| Area | Change |
|---|---|
| `assessment.service.ts` | upsert on the new key; stop re-tagging the period; only active-period rows are writable (create, update, approve, delete) |
| `score-recalculation.service.ts` | read only the current period's rows (the inflation guard) |
| `config` periods | rollover on activation; state-machine guard; refuse delete when in use |
| deletes (competency, technology, domain) | 409 "in use, deactivate instead" |
| reports | no change needed (YoY already groups by period); add a test that two periods show two values |
| `communication` / `behavioral` | check the same period rules for their writes (SEC-014 follow-up) |

## 6. How we prove nothing breaks (rehearsal on a copy of your database)

1. **Backup** the database, then restore it to a throwaway database. Nothing touches your dev data.
2. **Before:** run the score snapshot and the old-versus-new comparison harness (the one used for release 1.1.1).
3. **Apply migration A** and the new code to the copy.
4. **After A, nothing may change:** scores identical to the baseline (53 people, 731 rows), all 245 read answers identical for all 7 roles, the 30-step write scenario identical, all tests green.
5. **Rollover rehearsal on the copy:** create CY2027 as a copy, activate it, and check:
   - 1,624 approved rows were copied, the 39 drafts were not;
   - 2027 scores equal the 2026 scores at the moment of copy;
   - the year-on-year report shows 2026 and 2027;
   - editing a 2027 row does not change 2026;
   - lock CY2026 and confirm every write to it is refused (API **and** direct SQL);
   - run **migration B** on the copy, then the full test and comparison suite again.
6. **Mandatory new tests:** two periods never inflate a score; a second active period is refused; a locked period refuses writes; deleting an in-use skill answers 409; rollover is idempotent.
7. Staging pipelines, then `master`, then a tag (1.2.0), as before, with both `master` backups first.

## 7. Pre-flight queries for **production** (read-only, you run them)

```sql
SELECT count(*) FILTER (WHERE appraisal_period_id IS NULL) AS null_period,
       count(*) FILTER (WHERE competency_id IS NULL)       AS null_competency,
       count(*)                                            AS rows FROM skill_assessments;
SELECT count(*) AS active_periods FROM appraisal_periods WHERE is_active;
SELECT appraisal_period_id, status, count(*) FROM skill_assessments GROUP BY 1,2 ORDER BY 1,2;
SELECT code, status, is_active, auto_rollover_skills FROM appraisal_periods ORDER BY id;
-- would the new keys hold? (must return 0 rows)
SELECT employee_id, technology_id, appraisal_period_id, count(*) FROM skill_assessments GROUP BY 1,2,3 HAVING count(*) > 1;
SELECT employee_id, competency_id, type, appraisal_period_id, count(*) FROM skill_assessments GROUP BY 1,2,3,4 HAVING count(*) > 1;
```
**If production has more than one period, or any non-zero result above, we stop and adjust the plan before running anything.**

## 8. Risks and how each is controlled

| Risk | Level | Control |
|---|---|---|
| Scores inflate once a second period exists | **High if missed** | Recompute reads the current period only; mandatory test; rehearsal step 5 |
| Migration B cannot be undone | High | Separate release, run just before the next period opens, backup and your explicit go |
| New unique index fails on dirty production data | Medium | Pre-flight queries; nothing runs if they are not clean |
| Trigger blocks a legitimate script or an employee hard-delete in a locked period | Medium | Employees are soft-deleted; scripts reviewed; rehearsal includes the scripts folder |
| Old and new code deployed at different times | Low | Migration A is additive: both versions work |
| Locking or long migration time | Low | Tables are small (1,663 rows); plain index builds take milliseconds |

## 9. Decisions I need from you (D6 and related)

1. **D6, rollover:** copy forward the **approved** rows into the new period and keep all periods? *(recommended: yes)*
2. **Locked or archived periods:** completely read-only, including for admins? *(recommended: yes; correcting a locked year needs an explicit unlock, which is audited)*
3. **Deleting in-use config:** block with 409 and offer "deactivate"? *(recommended: yes)*
4. **Drafts at rollover:** leave drafts behind (not copied)? *(recommended: yes)*
5. **Scope split:** W4a = DAT-005, 006, 008 now; W4b = DAT-007 (scoring snapshot) later? *(recommended: yes)*
6. **When to run B:** I suggest only when you are about to open the next period, not before.

## 10. Timeline (rough, after your approval)

| Step | Effort |
|---|---|
| Tests first, code for 3.1 to 3.5 | about 3 days |
| Rehearsal on a copy and fixes | about 1 day |
| Staging, `master`, tag, your deploy and migration A | about 1 day plus your window |
| Migration B | later, at the next period |

## 11. Not part of W4
DAT-007 (scoring snapshot, W4b), DAT-009 (migration policy: expand/contract and a backup gate, applied by following this plan; no extra SQL), the CEFR and behavioral write paths beyond the period rule.

## 12. Built and rehearsed (2026-10-09)

What was built (backend only; no frontend change): migration `20261009000000_w4a_appraisal_history` (+ `ROLLBACK.sql`), current-period helper, recompute reads the current period only, edits only in the active period (403 `PERIOD_NOT_ACTIVE`), period life cycle (closed periods never reopen), one active period (activating one switches the others off), rollover on activation (copies approved rows, aborts with `ROLLOVER_INCOMPLETE` if the old keys still block it), 409 `IN_USE` for deleting a skill, tool, group or period that has history.

Evidence (all on throwaway copies of the local database; nothing on production):
- 1,296 backend tests pass (81 suites); changed files 87-100 % covered; Sonar pre-check 0 hits on new lines.
- Migration A on a copy: Prisma schema diff empty; all 53 people / 731 scores recompute to exactly the stored values.
- Rollback script on a copy: schema identical to the original, byte for byte.
- 159 read answers (8 reports x 15 users across 5 roles, roster, pending approvals, 53 skill lists, gap analysis): old code on the old schema = old code on the migrated schema = new code on the migrated schema, zero differences. So old and new code can run against migration A in any deploy order.
- 30-check rollover rehearsal (migration B applied on the copy first): 1,624 approved rows copied, drafts not; CY2026 untouched; scores identical after rollover; idempotent; YoY shows both years; edit in 2027 leaves 2026 unchanged; locked 2026 refuses service writes and direct SQL UPDATE/DELETE/INSERT; a second active period is refused by the database; in-use deletes answer 409.

Migration B (NOT shipped; run only just before a second period is opened, after a verified production backup):
```sql
DROP INDEX skill_assessments_employee_id_technology_id_key;
DROP INDEX skill_assessments_employee_id_competency_id_type_key;
-- and in the same release remove the two old @@unique lines from prisma/schema.prisma
```
Until B is applied, activating a new period fails cleanly with `ROLLOVER_INCOMPLETE` and changes nothing.
