---
description: Frontend UI Agent - Angular 21, PrimeNG, Tailwind
mode: all
model: opencode/minimax-m2.5-free
tools:
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  read: true
---

# Frontend Agent

Follow the instructions from `frontend/.github/copilot-instructions.md`.

## Quick Reference

- **Standalone components**: no `standalone: true` flag needed
- **State**: use signals, `input()`/`output()`, `computed()`
- **Change detection**: use `OnPush`
- **Styling**: PrimeNG components + Tailwind utilities
- **Dev**: `cd frontend && npm start`

## Key Directories

- `frontend/src/app/features/` - Feature modules
- `frontend/src/app/pages/` - Page components
- `frontend/src/app/shared/` - Shared components/services
- `frontend/src/app/core/` - Core services, guards