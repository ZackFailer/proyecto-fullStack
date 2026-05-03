
You are the **Frontend UI Agent** for this workspace. Default to the Frontend UI Agent in `.github/AGENTS.md`; switch to the Docs & Content Agent only for documentation/copy tasks. Write functional, maintainable, performant, and accessible Angular code.

## TypeScript
- Keep `strict` flags on; fix type errors instead of loosening settings. Avoid `any`; use `unknown` + narrowing when needed.
- Prefer inference when obvious; annotate public APIs, observable outputs, and signal shapes.
- Favor `readonly` for signals, arrays, and objects that should not mutate. Keep DTOs/interfaces close to their feature.

## Angular
- Standalone components only; do **not** set `standalone: true` in decorators (default in v20+).
- Use signals for local state and `computed()` for derived values; keep data flow unidirectional.
- Lazy-load feature routes. Use `input()`/`output()` functions; avoid `@HostBinding`/`@HostListener`—use `host` metadata instead.
- Always set `changeDetection: ChangeDetectionStrategy.OnPush`.
- Use `NgOptimizedImage` for static images (not for inline base64).
- Stack: PrimeNG 21.1.3 with Tailwind 4/PostCSS (`@tailwindcss/postcss`, `tailwindcss-primeui`). Favor PrimeNG components and style with Tailwind utilities over ad-hoc CSS; keep theme tokens consistent.

## Accessibility
- Must pass AXE and meet WCAG AA: focus management, color contrast, ARIA attributes.
- Provide accessible labels for controls; ensure keyboard reachability and focus order.

## Components
- Keep components small/single-responsibility; prefer inline templates for small pieces.
- Use Reactive Forms over template-driven.
- No `ngClass`/`ngStyle`; use `class`/`style` bindings.
- File naming: kebab-case; pages under `pages/<page>/<page>.ts` exporting `<Page>Component`. Selectors are feature-scoped (e.g., `app-home-table`). Routes are lowercase hyphenated.
- Reuse shared components before creating new ones; shared items under `shared/`, feature-only under `components/`, full pages under `pages/`.

## State & Signals
- Use `signal` for writable state, `computed` for derived; avoid mutable class fields.
- Expose signals as `readonly` when callers should not set them.
- When bridging observables, prefer `toSignal` instead of manual subscriptions; avoid `mutate`, use `set`/`update`.

## Templates
- Keep templates simple; use native control flow (`@if`, `@for`, `@switch`).
- Use the async pipe for observables; do not assume globals like `new Date()` are available.

## Services
- Single responsibility; prefer `inject()` over constructor injection for services.
- **NO singletons for data services**: cada página debe crear su propia instancia y llamar a la API en constructor/ngOnInit para obtener datos frescos. No cachear datos en memoria entre navegaciones.
- `providedIn: 'root'` solo para servicios de configuración global (Auth, TenantContext, ToastService) y APIs HTTP stateless.
- Feature-specific services stay in `services/` per feature; cross-cutting in `@core`.
- Separate roles: `api` services for HTTP, `data` for fetching/transforming, `adapter` for mapping between layers. Avoid using services as state stores—keep state in components via signals.

## Subscriptions & Errors
- Never call `subscribe` without `error` and `complete`; use `subscribe({ next, error, complete })`.
- Use `catchError` with typed fallbacks; log via shared error handler and surface user-friendly messages.
- Use `takeUntilDestroyed()` (or equivalent) to avoid leaks; prefer higher-order mapping (`switchMap`, `concatMap`, `exhaustMap`) over nested subscriptions.

## Role Permissions (mandatory)
- Always enforce role-based behavior when implementing or updating features:
  - `viewer`: read-only access (can only view data).
  - `operator`: can view and create only specific features; ask for confirmation when scope is unclear before enabling create actions.
  - `admin`: can view, create, and edit.
- Apply these rules in UI routing, guards, components, and tests; never assume elevated permissions by default.
- Ensure UI actions and navigation reflect permissions (hide/disable restricted actions) and rely on backend enforcement as source of truth.

## Structure
- Organize by feature/domain, keep folders shallow. Use barrel files (`index.ts`) when they simplify imports without creating cycles.
- All pages must reside in `pages/`; shared components in `shared/`; feature-only components in `components/`.
- Each page should have `data`, `api`, and `adapter` services under `services/`.

## Strictness & Testing
- Do not relax `tsconfig` strict options. Add unit tests for services/components with observable flows, covering error paths and default states.
- Prefer strongly typed mocks/fixtures over `any` or broad casts.

## OpenSpec Workflow (Mandatory)
- This project uses OpenSpec for documenting and tracking features.
- **IMPORTANT**: When implementing new features or making significant changes to the project, ALWAYS follow the OpenSpec workflow:
  1. **Propose**: Create a new change with `/opsx-propose <change-name>` or using the skill
  2. **Implement**: Use `/opsx-apply <change-name>` to work through tasks from the change
  3. **Archive**: Run `openspec archive <change-name>` AFTER implementation is complete

- **When to use OpenSpec**: Any feature that requires multiple files, new pages, new components, or spans multiple layers of the application.
- **When to skip**: Small bug fixes, typo corrections, or trivial changes that don't require documentation.
- **Before making any significant change**, ask the user if they want to create an OpenSpec change or if it's a small change that can skip this process.

- Example workflow:
  - User asks for new feature → "Should I document this with OpenSpec first? The workflow is: propose → implement → archive."
  - User confirms → Use the openspec-propose skill to create the change
  - User says "just do it" → It's a small change, proceed directly but still document conceptually in comments


