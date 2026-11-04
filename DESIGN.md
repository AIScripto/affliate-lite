---
name: Oval Media Affiliate Tracking
description: Enterprise affiliate marketing and real-time attribution console
colors:
  primary: "#6366F1"
  primary-hover: "#4F46E5"
  canvas: "#0B0E14"
  surface: "#121620"
  surface-elevated: "#1A1F2C"
  border-subtle: "#252C3E"
  success: "#10B981"
  success-hover: "#059669"
  info: "#0284C7"
  warning: "#F59E0B"
  danger: "#EF4444"
  fg: "#FFFFFF"
  fg-heading: "#FFFFFF"
  fg-muted: "#CBD5E1"
  fg-subtle: "#94A3B8"
  light-canvas: "#F4F6FB"
  light-surface: "#FFFFFF"
  light-surface-elevated: "#F8FAFC"
  light-border-subtle: "#CBD5E1"
  light-primary: "#4F46E5"
  light-fg: "#0F172A"
  light-fg-heading: "#000000"
  light-fg-muted: "#334155"
  light-fg-subtle: "#64748B"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  small:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "0.875rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-success-hover:
    backgroundColor: "{colors.success-hover}"
---

## Overview

The **Oval Media Affiliate Platform** design system is an enterprise operations console built for high cognitive clarity, rapid task execution, and deep visual appeal. It follows an **Operate** mode design philosophy where scanability, information density, and data integrity take precedence over marketing fluff, while preserving tactile 3D physical depth, high contrast, and refined micro-interactions.

Both **Dark Mode** (default) and **Light Mode** are fully supported, using a unified CSS custom property token architecture.

---

## Colors

The palette balances dark deep slate canvases with vivid, accessible primary indigos, emerald greens for positive attribution events, amber warnings for pending states, and clean status tags.

### Dark Theme (Default)
- **Canvas / Background:** `#0B0E14` (Deep space navy)
- **Surface / Cards:** `#121620` (Subtle tinted dark slate)
- **Surface Elevated:** `#1A1F2C` (Raised panels, tooltips, dialogs)
- **Borders & Dividers:** `#252C3E` (High definition border contrast)
- **Primary Accent:** `#6366F1` (Indigo electric) / Hover: `#4F46E5`
- **Success / Attributed:** `#10B981` (Emerald green) / Hover: `#059669`
- **Text Primary:** `#FFFFFF` (High contrast pure white)
- **Text Muted:** `#CBD5E1` (Readable slate-200)
- **Text Subtle:** `#94A3B8` (Slate-400 for secondary hints)

### Light Theme
- **Canvas / Background:** `#F4F6FB` (Crisp cool neutral)
- **Surface / Cards:** `#FFFFFF` (Pure white)
- **Surface Elevated:** `#F8FAFC` (Card headers and subpanels)
- **Borders & Dividers:** `#CBD5E1` (Defined structural bounds)
- **Text Primary:** `#0F172A` (Slate-900 contrast)
- **Text Heading:** `#000000` (Bold deep black)

---

## Typography

Typography uses the geometric sans-serif **Inter** for UI readability and **JetBrains Mono** for tracking macros, URLs, tokens, and technical parameters.

- **Display & Page Titles:** `Inter`, font-weight 700/800, tight tracking (`-0.025em`).
- **Section Headers & Card Titles:** `Inter`, font-weight 700, crisp high-contrast headings.
- **Data & Body Copy:** `Inter`, font-weight 400/500, tabular figures (`tabular-nums`) for numeric data.
- **Code & Tracking Macros:** `JetBrains Mono`, font-weight 500, size `11px` to `12px`.

---

## Layout

- **Admin Shell:** Fixed left navigation sidebar with responsive collapse; scrollable top header with active profile and 1-click Theme Toggle.
- **Metric Tiles:** 4-column metric cards displaying core campaign figures (`Total Offers`, `Active Routing`, `Total Clicks`, `Conversions`) with distinct color themes.
- **Table-First Visual Scannability:** Tabular presentation is strictly enforced for complex configurations, parameters, and postback mappings. Wrapping badge clouds or messy pills are forbidden.
- **Separate Config UIs & Tabbed Views:** Complex views (such as the Offer Builder) partition features across clean horizontal tabs (`Tracking`, `Targeting`, `Affiliates`, `Postbacks`, `Revenue`) to avoid endless vertical scroll.

---

## Elevation & Depth

All cards and buttons implement tactile 3D physical depth with subtle top-edge bevel highlights:

- **Panel Cards (`.panel-card`):**
  - Inner top highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`
  - Drop shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.15)`
- **Tactile Buttons (`.btn-3d-primary`, `.btn-3d-success`):**
  - Top bevel highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.25)`
  - Bottom shadow: `0 2px 4px 0 rgba(0, 0, 0, 0.35)`
  - Active pressed state: `active:scale-[0.98]` with instant feedback.
- **Gradients:** Smooth 3D title bar gradients with linear fills from primary deep slate into indigo and emerald.

---

## Shapes

- **Base Cards & Panels:** `0.875rem` (`rounded-xl` to `rounded-2xl`).
- **Buttons & Form Inputs:** `0.5rem` (`rounded-lg`) to `0.75rem` (`rounded-xl`).
- **Badges & Status Tags:** `rounded-md` (`6px`) or `rounded-full` for pills.
- **Border Treatment:** Explicit `1px` subtle borders (`--color-border-subtle`) ensure cards remain clearly demarcated against the canvas in both dark and light modes.

---

## Components

### 1. Data Tables (`<DataTable />`)
- Alternating subtle rows with hover highlights.
- Clear column headers with sort indicators and explicit alignment (left for text, right for metrics, center for status/actions).
- Integrated search filter and pagination controls.

### 2. Action Buttons (`<ActionButtons />`)
- Standardized, reusable action button group for Edit, Duplicate, Toggle Active/Paused, and Delete.
- Smooth tooltips and consistent icon sizing (`14px` - `16px`).

### 3. Modals & Dialogs (`<Modal />`)
- Center-aligned backdrop blur overlay (`backdrop-blur-sm`).
- High-contrast modal header with close button.
- Clear primary and secondary actions with destructive confirmation styling for delete actions.

### 4. Interactive 1-Click Tokens (`<ActivePostbackParamsManager />`)
- Macro tokens and parameters can be copied to clipboard or appended to URLs with a single click.
- Instant visual feedback: `"Copied!"` or `"In URL ✓"` with emerald highlight.

---

## Do's and Don'ts

### Do's
- **DO** use clean data tables for dense parameter lists, webhooks, and rules.
- **DO** maintain high contrast between text (`--color-fg`, `--color-fg-heading`) and background.
- **DO** provide instant visual feedback on any copy or toggle action.
- **DO** use tabular numerals (`tabular-nums`) for currency, conversion counts, and timestamps.
- **DO** test all new views in both Dark Mode and Light Mode.

### Don'ts
- **DON'T** use wrapping badge clouds for dense configuration data.
- **DON'T** use low-contrast text (e.g., light gray on white or dark slate on black).
- **DON'T** hardcode colors, padding, or fonts; always reference Tailwind classes or design tokens.
- **DON'T** use jarring unbounded animations; keep micro-interactions subtle (150ms-250ms ease).
- **DON'T** create long scrolling monolithic configuration pages; divide complex configurations into distinct tabs.

