# Workspace Rules & Execution Guidelines

## 1. Automated Testing Rule
- Only run automated tests where strictly required or when explicitly requested by the user.
- Do not run automated test suites prematurely or unnecessarily.

## 2. Autonomous Execution & Permissions Rule
- Do not prompt or ask for permission/confirmation before running commands, executing scripts, editing code, or progressing tasks, unless the user explicitly asks to be prompted for permission.
- The default permission is **permission=yes** for running shell commands, build scripts, database operations, and development tools. Complete tasks end-to-end autonomously and report results upon completion.

## 3. Definition of Done (DOD) Rule
Every feature, UI configuration, and bug fix must comply with the project Definition of Done ([DOD.md](file:///Users/tk-lpt-1088/projects/react/affliate/DOD.md)):
1. **Simple Layman English**: Always write clear, plain English suitable for non-native English speakers. Avoid obscure developer/technical jargon in UI copy and documentation.
2. **Table-First Visual Layout**: Never use wrapping badge clouds or messy pills for dense parameters or configuration data. Always present parameters, webhooks, and settings in clean, scannable **tables** with clear columns.
3. **Separate Config UIs & Tabbed Views**: Keep every configuration UI distinct and separated from other modules. Use clean **tabs** within single complex configuration views to divide sections (e.g. templates, parameter table, simulator, guide) and prevent long, cluttered pages.
4. **Multi-Theme Support & 3D Gradient Aesthetic**: Support both Dark Mode and Light Mode with high contrast and readable typography. Apply modern 3D depth, subtle top bevel highlights, tactile button shadows, and smooth gradients.
5. **1-Click UX & Instant Feedback**: Parameter tokens and query strings must be copyable or appendable to URLs in a single click with instant visual confirmation ("Copied!", "In URL ✓").
6. **Data Integrity & Zero-Leak Redirection**: Missing/invalid partner parameters must safely fallback to the master account so traffic/revenue is never lost. Webhook postbacks must be idempotent (no duplicate orders/accruals).
7. **Always Write Test Cases**: Write thorough test cases covering positive flows, edge cases, and error recovery for every feature into the test directories. (*Do not run automated test suites unless explicitly commanded by the user*).
8. **Modular & Reusable Component-Based Development**: Always use a modular, reusable approach with component-based architecture. Use generic reusable UI components for controls (inputs, textboxes, radio groups, checkboxes, toggle switches, buttons, modals, tabs, tables, dropdown selects, badges).
9. **Zero Hardcoding Standard**: Never hardcode values (strings, status options, colors, numbers, endpoints, currency symbols, macro tokens, or styling rules). Always extract into centralized constants, configuration objects, enums, tokens, or typed props.
10. **Pre-Commit & Build Verification**: Code must pass pre-commit checks (`tsc --noEmit`, syntax check, no merge conflicts or broken types) with 0 errors before commits and pushes.
