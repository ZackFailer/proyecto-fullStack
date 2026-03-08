---
name: backend-agents
description: "Use when: choosing the right agent for backend API work (Express, TypeScript, Mongo)"
---

# Agents

- **Backend API Agent (default)**
  - Scope: everything under `src/` (routers, controllers, services, models, middleware, config).
  - Model: GPT-5.1-Codex-Max.
  - Behavior: follow `.github/copilot-instructions.md`; keep strict TypeScript, ES module imports with `.js` extensions, and propagate errors to centralized handlers.
  - Tests: prefer integration tests for routers/controllers and unit tests for services with mocked models.

- **Docs & Config Agent**
  - Scope: README, environment/config docs, and comments that explain behavior.
  - Behavior: keep responses concise, avoid inventing values; surface TODOs when details are missing.

# How to pick

1. For code changes in `src/**`, default to **Backend API Agent**.
2. For documentation-only updates or config description, use **Docs & Config Agent**.
3. If a request mixes both, prioritize code first, then document the change succinctly.

# Shared context

- Always use the JSON envelope responses and error-handling conventions from `.github/copilot-instructions.md`.
- Validate inputs early, guard ObjectIds, and use the Mongoose connection helper; never connect ad-hoc.
- Maintain layered flow: routers → controllers → services → models → config.
- Ask for missing domain details instead of guessing (e.g., validation rules, error codes, required fields).
