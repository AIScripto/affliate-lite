# Tool scan summary (Stage 1), 2026-10-07, master, BE 227b698, FE 45ae7f7

All numbers come from the saved output in `evidence/tool-output/`. Nothing is estimated.

## Project checks (run with your approval; localhost DB)

| Check | Backend | Frontend |
|---|---|---|
| Type-check | pass, 0 errors | pass, 0 errors |
| Lint | pass | 0 errors, **91 warnings** (63 `any`, 13 fast-refresh, 2 hook deps) |
| Tests | **548 passed**, 37 suites, 0 failed | **2,334 passed**, 136 files, 0 failed |
| Coverage (lines) | **66.08%** (statements 65.65, branches 55.14, functions 71.72) | **83.42%** (branches 94.51, functions 92.25) |

## Scanners

| Tool | Backend | Frontend |
|---|---|---|
| gitleaks 8.30.1 (full history, redacted) | 0 leaks | 0 leaks |
| npm audit, all deps | 39 (1 critical, 32 high, 6 moderate) | 17 (2 critical, 10 high, 5 moderate) |
| npm audit, **production deps only** | 8 (**1 critical**, 3 high, 4 moderate) | 11 (**0 critical**, 7 high, 4 moderate) |
| trivy fs (vuln + misconfig) | 14 vulns (1 critical, 8 high, 5 medium); Dockerfile: runs as root (DS-0002) | 18 vulns (0 critical, 9 high, 9 medium); Dockerfile: runs as root |

Production-dependency highlights:
- **Backend critical:** `proxy-addr` 2.0.7 (fix 2.0.8), IP spoofing via IPv4-mapped IPv6 trust subnet (GHSA-jqcg-44mw-7w3h). Reachable only if Express `trust proxy` is configured (to check in Stage 3).
- Backend high: `fast-uri` 3.1.5 (SSRF and host confusion, 6 CVEs; fix 3.1.7), `brace-expansion` 5.0.9, `js-yaml` 4.3.1 (DoS). Moderate: `express`, `body-parser`, `qs`.
- Frontend high: `axios` 1.19.0 (7 CVEs, fix 1.20.0), `braces`, `source-map-js`, `tailwindcss` chain. Moderate: `react-router-dom` (open redirect). Many of the frontend ones are build-time tools (tailwind, postcss) that do not ship to browsers.
- The jest chain accounts for most of the backend "high" count; it is dev-only.

## Not run (not installed)
semgrep, osv-scanner, hadolint, jscpd, madge, cloc, syft, checkov, trufflehog. Static analysis, duplication, import-cycle and licence checks are done by hand where possible and listed in coverage.
