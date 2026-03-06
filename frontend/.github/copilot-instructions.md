
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- Prefer using `shared` folder for reusable components, directives, and pipes that are used across multiple features, and use `components` folder for components that are specific to a single feature or domain.
- Prefer using `pages` folder for components that represent full pages or views in the application, and use `components` folder for smaller, reusable components that are used within those pages.
- Prioritize reusing 'shared' components if they exist before creating new ones in 'components' folder.
- If need create a new component, first check if there is an existing one in the 'shared' folder that can be reused. If not, create a new component in the 'components' folder of the relevant feature module and use the component of primeNG.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- Prefer using `services` folder for services that are specific to a single feature or domain, and use `core` folder for services that are used across multiple features, such as authentication, logging, or error handling.
- Avoid using services as a state management solution; prefer signals and `computed()` for local state and derived state instead.
- `data` services should be responsible for fetching and transforming data, while state management should be handled within components using signals.
- `api` services should be responsible for making HTTP requests and handling API interactions, while `adapter` services should be responsible for transforming data between different layers of the application.


## Structure

- Organize files by feature or domain rather than by type
- Use clear and consistent naming conventions for files and symbols
- Keep a flat file structure within feature folders, avoid deep nesting
- Use barrel files (`index.ts`) to re-export symbols for easier imports
- Avoid circular dependencies by carefully managing imports and using interfaces when necessary
- Use a consistent folder structure for components, services, and other artifacts within each feature module.
- For example, within a `products` feature folder, you might have subfolders for `components` and `services`.
- All pages need to be in a `pages` folder, and all shared components in a `shared` folder.
- All pages need `data` service, `api` service and `adapter` service, and they need to be in a `services` folder.


