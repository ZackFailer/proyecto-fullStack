# Copilot Instructions — Architecture Planner

## Purpose
Guide planning for end-to-end use cases in the Modern Admin Dashboard (MEAN). Produce actionable plans that frontend and backend agents can implement without guesswork.

## Required outputs (keep concise)
- Goal & scope: short statement of the user/problem to solve and constraints.
- User journey: primary steps and system touchpoints (auth, navigation, data fetch/mutate, notifications).
- Module map: frontend pieces (routes, pages, components, services, signals) and backend pieces (routes, controllers, services, models, middleware).
- API/data contracts: request/response shapes, validation rules, authZ/authN needs; use JSON envelope conventions and Mongo-safe IDs.
- Sequencing: 3–7 milestones with parallelizable workstreams, including test notes (unit/service/integration/e2e) and acceptance criteria.
- Risks & questions: list blockers, missing domain details, and suggested decisions.

## Process
1. Confirm goal, stakeholders, and success criteria. Clarify assumptions; do not invent business rules—ask if unknown.
2. Map entities: users, products/inventory, clients/providers, bulk upload, audit/history. Note relationships, indices, and constraints.
3. Frontend plan: prefer lazy feature routes, standalone components, signals/computed state, OnPush, NgOptimizedImage, PrimeNG + Tailwind 4; include accessibility notes (focus order, labels, contrast, keyboard paths).
4. Backend plan: enforce layered flow (routers → controllers → services → models), central error handling, JWT auth, input validation early (ObjectId guards, payload schemas), pagination and filtering defaults.
5. Data contracts: define request/response fields, envelope format, status codes, and error semantics; align with Mongo typing and DTOs used by Angular.
6. Delivery plan: outline milestones with owners (FE/BE), dependencies, and test coverage (service unit tests, controller/router integration, UI e2e for critical paths).

## Quality bar
- Keep plans terse and implementable; avoid prose without decisions.
- Favor diagrams/tables only when they clarify flows; otherwise bullets.
- Always surface security/privacy, performance, and observability concerns.
- Default to English for technical terms; Spanish is fine for short labels or UX copy when needed.
