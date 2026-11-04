# Affiliate Platform — Audit & Architecture Guide

This directory holds the **Audit Kit**, project configuration, standards, prompts, and audit records for the **Affiliate Tracking & Campaign Management Platform (Oval Media)**.

---

## 1. Active Audit Artifacts (Source of Truth)

The audit framework and standards for this repository live in `audit/`:

| Artifact | Location | Purpose & Status |
| :--- | :--- | :--- |
| **Audit Kit Core Engine** | [`audit/kit/AUDIT.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/kit/AUDIT.md) | Reusable, stack-independent audit engine and evaluation framework. |
| **Audit Prompts** | [`audit/PROMPTS.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/PROMPTS.md) | 18 ready-to-paste AI agent prompts for running quick, full, security-only, pre-release, or diff-mode audits on the monorepo. |
| **Project Configuration** | [`audit/config.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/config.md) | Primary configuration defining monorepo boundaries (`backend/` and `frontend/`), technology stack, include/exclude paths, and known accepted domain rules. |
| **Project Standards & Domain Checklists** | [`audit/project-standards.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/project-standards.md) | Domain audit checklists encoding zero-leak redirection, idempotent postbacks, multi-theme 3D aesthetics, and Definition of Done (DOD) invariants. |
| **Definition of Done (DOD)** | [`DOD.md`](/Users/tk-lpt-1088/projects/react/affliate/DOD.md) | Project-wide definition of done (10 rules) including table-first visual layout, 1-click UX, zero hardcoding, and multi-theme support. |

---

## 2. Platform UI/UX Standards & Definition of Done

The Affiliate Platform enforces the **Oval Media Pro-Level 3D Aesthetic & DOD** standards:

1. **Simple Layman English**: Clear, plain English suitable for non-technical users and international partners.
2. **Table-First Visual Layout**: Clean, scannable parameter tables with distinct columns instead of wrapping badge clouds.
3. **Separate Config UIs & Tabbed Views**: Distinct configuration modules with tabbed sub-sections (templates, parameter tables, simulator, guides).
4. **Multi-Theme Support & 3D Gradient Aesthetic**: High contrast, readable typography, tactile button depth, and subtle top bevel highlights in both Dark and Light modes.
5. **1-Click UX & Instant Feedback**: Parameter tokens and query strings copyable or appendable to URLs in a single click with instant visual feedback.
6. **Zero-Leak Redirection**: Missing or invalid partner parameters fallback safely to the master account.
7. **Zero Hardcoding**: All options, endpoints, statuses, colors, and macro tokens extracted to centralized constants.

---

## 3. Technology Stack Alignment

| Tier | Component | Technology & Version | Specifications |
| :--- | :--- | :--- | :--- |
| **Frontend** | Framework | React 18, Vite, TypeScript | SPA client, modular components |
| | Design System | Tailwind CSS + Lucide Icons | Dual-theme (Dark/Light), 3D depth, responsive layouts |
| | Networking & State | Axios, React Hooks | REST API client, local state management |
| **Backend** | Runtime & API | Node.js 22+, Express, TypeScript | RESTful API endpoints, CORS, JSON routing |
| | Database & ORM | PostgreSQL, Prisma ORM | Relational models (Offers, Publishers, Domains, Conversions) |
| **Exposed Ports** | Services | Frontend: `3085`, Backend: `3086` | Standardized exposed ports for local and container deployment |
| **Orchestration** | Containers | Docker, Docker Compose | `affliate-be` (3086), `affliate-fe` (3085) |

---

## 4. How to Run a New Audit

To run an automated audit using the kit:
1. Open your AI agent or terminal in `/Users/tk-lpt-1088/projects/react/affliate`.
2. Select a prompt from [`audit/PROMPTS.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/PROMPTS.md).
3. The kit will execute scanners, evaluate domain rules in [`audit/project-standards.md`](/Users/tk-lpt-1088/projects/react/affliate/audit/project-standards.md), and write the report to `audit/results/<date>_<name>/report.html`.
