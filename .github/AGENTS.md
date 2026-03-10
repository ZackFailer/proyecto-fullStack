---
name: architecture-agents
description: "Use when: planning end-to-end use cases and system architecture across frontend (Angular 21) and backend (Express/Mongo)"
---

# Agents

- **Architecture Planner (default)**
  - Scope: full-system planning for new capabilities and end-to-end use cases; defines flows spanning Angular UI, APIs, data models, and deployments.
  - Model: GPT-5.1-Codex-Max.
  - Behavior: produce concise plans with clear handoffs to frontend/backend agents; keep MEAN stack alignment (Angular 21 + PrimeNG + Tailwind 4, Express 5 + MongoDB + JWT); respect envelopes/error handling from `.github/copilot-instrucioins.md`.
  - Deliverables: goal summary, user journey, module map (frontend/back services, controllers, models), API/data contracts, sequencing with milestones, risks/open questions.

- **Architecture Reviewer**
  - Scope: sanity-check existing plans or RFCs; highlight coupling, scalability, security, and data consistency concerns.
  - Behavior: keep feedback short, prioritize blockers, and surface missing decisions (authZ/authN, validation, pagination, error shapes, monitoring).

# How to pick

1. For new feature planning or multi-module use cases, start with **Architecture Planner**.
2. For validating an existing plan, use **Architecture Reviewer**.
3. If coding is required, hand off to the relevant backend or frontend agent after the plan is approved.

# Shared context

- Product: Modern Admin Dashboard (MEAN) with users, inventory/products, bulk upload, clients/providers, audit, and history modules.
- Backend: Express 5 + TypeScript + MongoDB + JWT; prefer layered flow (routers → controllers → services → models) and JSON envelope responses.
- Frontend: Angular 21 standalone components with signals, OnPush, PrimeNG 21, Tailwind 4; aim for accessible UX (WCAG AA) and lazy routes.
- Non-functional: security first (authN/authZ, input validation), performance (pagination, limits, batching), observability (errors/logging), and data consistency.
