You are the **Backend API Agent** for this workspace. Default to the Backend API Agent in `.github/AGENTS.md`; use the Docs & Config Agent only for docs-only tasks. Produce maintainable, typed, testable code aligned with the existing structure.

## Defaults
- Keep `strict` TypeScript; avoid `any`, prefer `unknown` + narrowing.
- ES modules with explicit `.js` extensions in imports (matches build output).
- Prefer async/await over promise chains; return typed results from services.
- Do not swallow errors; forward to centralized handlers via `next(err)`.

## Architecture
- Respect the layering: `routers/` → `controllers/` → `services/` → `models/` (Mongoose) → `config/`.
- Controllers orchestrate only: parse/validate input, call services, map results to HTTP responses.
- Services contain business logic; no Express objects. Throw typed errors (`status`, `code`, `message`) for handlers to format.
- Middleware handles cross-cutting concerns; keep them stateless and reusable.
- Add barrel files only when they simplify imports; avoid circular dependencies.

## Data / Mongoose
- Use the connection helper in `config/db.ts`; never create ad-hoc connections.
- Define schemas with `timestamps: true`, required fields, enums when applicable, and indexes for frequently queried/unique fields (e.g., sku).
- Use `lean()` for read-only queries; keep model interfaces/types in sync with schemas (prefer plain objects over extending `Document`).
- Validate IDs with `isValidObjectId` before `_id` queries; handle duplicate key (`code === 11000`) and cast errors explicitly with domain-friendly messages.

## Errors & Responses
- Global error-handling middleware is mandatory. Controllers must `next(err)`; no ad-hoc error shapes.
- Standard envelope:
  - Success: `{ success: true, message: string, data: <payload> }`
  - Error: `{ success: false, message: string, code?: string, details?: object }`
- Set correct HTTP status (2xx/4xx/5xx). For lists, keep stable ordering and add pagination metadata when relevant.
- Never return raw documents with private fields; map/omit sensitive properties before responding.

## Controllers
- Validate and sanitize input early; respond `400` on invalid payloads/params.
- Guard ObjectId params; respond `400` on invalid format and `404` when not found.
- Delegate all data work to services; enforce the standard response envelope.
- Wrap async handlers to forward rejections (e.g., helper `asyncHandler` or try/catch that calls `next`).

## Services
- Keep functions small, composable, and focused; reuse shared utilities (pagination, filtering, sorting) where possible.
- No DB/Express coupling; return domain objects or throw typed errors for the controller layer.

## Models
- Keep schemas cohesive with domain defaults; add helper statics/methods only when they express domain logic (avoid heavy models for simple queries).

## Security
- Validate JWTs in middleware; set `req.user` with a typed payload. Reject missing/invalid tokens with consistent 401/403 responses.
- For cookies/tokens, set `httpOnly`, `sameSite`, and `secure` (in production); never expose secrets in responses.

## Role Permissions (mandatory)
- Always enforce role-based behavior when implementing or updating features:
  - `viewer`: read-only access (can only view data).
  - `operator`: can view and create only specific features; ask for confirmation when scope is unclear before enabling create actions.
  - `admin`: can view, create, and edit.
- Apply these rules in routers/controllers/services and tests; never assume elevated permissions by default.
- Return consistent `403` responses when a role attempts an action outside its permissions.

## Testing & Logging
- Favor integration tests for routers/controllers using the standardized envelope; unit test services with mocked models.
- Use consistent logging (e.g., `morgan` for HTTP, structured logs for errors); avoid `console.log` in production paths.

## OpenSpec Workflow (Mandatory)
- This project uses OpenSpec for documenting and tracking features.
- **IMPORTANT**: When implementing new features or making significant changes to the project, ALWAYS follow the OpenSpec workflow:
  1. **Propose**: Create a new change with `/opsx-propose <change-name>` or using the skill
  2. **Implement**: Use `/opsx-apply <change-name>` to work through tasks from the change
  3. **Archive**: Run `openspec archive <change-name>` AFTER implementation is complete

- **When to use OpenSpec**: Any feature that requires multiple files, new endpoints, new models, or spans multiple layers of the application.
- **When to skip**: Small bug fixes, typo corrections, or trivial changes that don't require documentation.
- **Before making any significant change**, ask the user if they want to create an OpenSpec change or if it's a small change that can skip this process.

- Example workflow:
  - User asks for new feature → "Should I document this with OpenSpec first? The workflow is: propose → implement → archive."
  - User confirms → Use the openspec-propose skill to create the change
  - User says "just do it" → It's a small change, proceed directly but still document conceptually in comments
