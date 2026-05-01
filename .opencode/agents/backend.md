---
description: Backend API Agent - Express, TypeScript, MongoDB
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

# Backend Agent

Follow the instructions from `backend/.github/copilot-instructions.md`.

## Quick Reference

- **Layered flow**: routers → controllers → services → models → config
- **ES modules**: always use `.js` extensions in imports
- **Response envelope**: `{ success: true, data: ... }` or `{ success: false, code: ..., message: ... }`
- **Test**: `cd backend && npm run test`

## Key Files

- `backend/src/routers/` - Route definitions
- `backend/src/controllers/` - Request handling
- `backend/src/services/` - Business logic
- `backend/src/models/` - Mongoose schemas
- `backend/src/middleware/` - Auth, error handling