---
name: frontend-agents
description: "Use when: choosing the right agent for Angular frontend work (signals, standalone components, accessibility)"
---

# Agents

- **Frontend UI Agent (default)**
  - Scope: feature code under `src/app/**` (pages, components, services, shared utilities), routing, and styles.
  - Model: GPT-5.1-Codex-Max.
  - Behavior: follow `.github/copilot-instructions.md`; strict TS, standalone components (no `standalone: true` flag), signals for state, OnPush change detection, and WCAG AA/AXE compliance.
  - Data flow: prefer lazy routes, `input()`/`output()`, `computed()`/`signal()` for state, and `NgOptimizedImage` for static images.

- **Docs & Content Agent**
  - Scope: docs under `doc/**`, README updates, and copywriting for UI text.
  - Behavior: concise, accessible phrasing; avoid adding code unless requested.

# How to pick

1. For UI/code tasks in `src/app/**`, use **Frontend UI Agent**.
2. For documentation or content edits, use **Docs & Content Agent**.
3. When a request mixes both, address code first, then update docs with the same agent if small; otherwise switch to **Docs & Content Agent**.

# Shared context

- Honor the Angular guidance in `.github/copilot-instructions.md` (signals, `input()`/`output()`, avoid `ngClass`/`ngStyle`, use OnPush).
- Keep accessibility in mind: focus order, ARIA labels, and color contrast.
- Reuse shared components/services before creating new ones; keep pages under `pages/` and feature-specific components under `components/`.
- Ask for missing UX/content details when unclear (labels, error messages, empty states).
- Stack notes: PrimeNG 21.1.3 with Tailwind 4/PostCSS (`@tailwindcss/postcss`, `tailwindcss-primeui`). Prefer PrimeNG components styled via Tailwind utilities; avoid inline styles.
