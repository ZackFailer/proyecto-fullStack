# Users Feature Architecture (MEAN)

## Goal & Scope
- Enable administrators to manage users end to end from a single page with an inline modal for create/edit: list, search, create, edit profile/role, deactivate/reactivate, and enforce authentication/authorization for all modules.
- Keep aligned with existing stack: Angular 21 (PrimeNG + Tailwind 4, signals) and Express 5 + MongoDB + JWT.

## Data Model (core entities)
- User
  - _id (ObjectId, PK)
  - email (string, unique, lowercased, indexed)
  - passwordHash (string, bcrypt)
  - firstName, lastName (string)
  - role (enum: admin | manager | viewer; indexed)
  - status (enum: active | suspended | pending_invite)
  - phone (string, optional), avatarUrl (string, optional)
  - lastLoginAt (date, optional)
  - createdAt, updatedAt (date, default now)
- Role (if separated later)
  - _id (ObjectId, PK)
  - name (string, unique)
  - permissions (string[]; e.g., users.read, users.write, inventory.read)
- AuditLog (for traceability)
  - _id, actorUserId, action (string), entityId, entityType ("user"), payloadDiff (object), createdAt

Indexes: email unique; role + status for filters; createdAt for sorting; optional text index on name/email for search.

## Main User Flow (happy path)
Paso 1 -> Usuario administrador inicia sesion (JWT) -> Paso 2 -> Navega al modulo "Usuarios" (una sola pagina) -> Paso 3 -> Lista de usuarios se carga con paginacion y filtros -> Paso 4 -> Admin hace clic en "Crear usuario" (abre modal) -> Paso 5 -> Completa formulario en el modal (datos basicos + rol) y envia -> Paso 6 -> Backend valida, hashea password (o genera temporal), crea registro y registra audit -> Paso 7 -> Modal se cierra, UI muestra confirmacion y lista se refresca -> Paso 8 -> Admin abre modal en modo edicion o desactiva/reactiva desde acciones de fila -> Paso 9 -> Cambios quedan auditados y reflejados en la vista.

## Module Map
- Frontend (Angular 21)
  - Route: /users (lazy feature)
  - Page: UsersPage (tabla + filtros + modal create/edit en la misma vista)
  - Components: UserTable (PrimeNG table + row actions), UserModal (formulario reactivo reutilizable para crear/editar), ConfirmDialog para desactivar/reactivar
  - Services: user-api.ts (HTTP client, typed DTOs, handles envelopes), user-store (signals para lista, filtros, usuario seleccionado, estado del modal)
  - Guards/Interceptors: existing auth-interceptor para JWT; canActivate guard para rol admin/manager
  - UX: skeleton en tabla, validacion inline en modal, focus trap y aria-describedby en modal, announce errors via aria-live
- Backend (Express 5 + TS)
  - Router: /api/users (protected)
  - Controller: users.controller maneja HTTP, delega a services, devuelve JSON envelopes
  - Service: users.service reglas (roles, transiciones de estado, hashing de password)
  - Model: User schema + indexes; Role schema opcional; AuditLog writer
  - Middleware: authenticate (JWT), authorize(roles[]), validate(ObjectId), request schema validation (celebrate/zod)
  - Config: centralized error handler y helper de conexion Mongoose

## API & Data Contracts (enveloped)
- POST /api/auth/login
  - Req: { email: string, password: string }
  - Res: { data: { token, user: { id, email, role, status } } }
- GET /api/users?search=&role=&status=&page=&pageSize=
  - Auth: admin|manager
  - Res: { data: UserDTO[], meta: { page, pageSize, total } }
- POST /api/users
  - Auth: admin
  - Req: { email, password?, firstName, lastName, role, phone?, status? }
  - Res: { data: UserDTO }
- GET /api/users/:id
  - Auth: admin|manager
  - Res: { data: UserDTO }
- PATCH /api/users/:id
  - Auth: admin
  - Req: { firstName?, lastName?, role?, status?, phone?, avatarUrl? }
  - Res: { data: UserDTO }
- PATCH /api/users/:id/password (self or admin)
  - Auth: admin or same user
  - Req: { currentPassword?, newPassword }
  - Res: { data: { ok: true } }
- DELETE /api/users/:id (soft delete -> status suspended)
  - Auth: admin
  - Res: { data: { ok: true } }

UserDTO: { id, email, firstName, lastName, role, status, phone?, avatarUrl?, lastLoginAt?, createdAt, updatedAt }.

Validation defaults: trim/lowercase email; password >= 12 chars; role in enum; status in enum; ObjectId guard for :id; rate-limit login.

## Validation Schemas (suggested)
- Common enums
  - role: ['admin','manager','viewer']
  - status: ['active','suspended','pending_invite']

- POST /api/auth/login
  - body: { email: string (email, lowercased, 5-120), password: string (8-128) }

- GET /api/users
  - query: { search?: string (0-80), role?: role, status?: status, page?: int>=1 default 1, pageSize?: int in [10,25,50] default 25 }

- POST /api/users
  - body: {
      email: string (email, lowercased, 5-120),
      password?: string (12-128; if absent, generate strong temporary),
      firstName: string (1-60),
      lastName: string (1-60),
      role: role,
      phone?: string (E.164 up to 20),
      status?: status (default active),
      avatarUrl?: string (url, 0-300)
    }

- PATCH /api/users/:id
  - params: { id: ObjectId }
  - body: at least one field among { firstName?: string (1-60), lastName?: string (1-60), role?: role, status?: status, phone?: string (E.164), avatarUrl?: string (url) }

- PATCH /api/users/:id/password
  - params: { id: ObjectId }
  - body: { currentPassword?: string (8-128, required if self-change), newPassword: string (12-128, must differ) }

- DELETE /api/users/:id
  - params: { id: ObjectId }

- Shared rules
  - Trim strings; lowercase email; reject HTML content; enforce max lengths; ObjectId guard for params.
  - Password strength: min length 12, require upper/lower/number/symbol; hash with bcrypt cost 10-12; never store raw.
  - Rate-limit login and password-change endpoints; return envelope errors with field details.

## Response Envelopes & Error Shapes
- Envelope (success): { data: T, meta?: object }
- Envelope (error): { error: { code: string, message: string, details?: array|object }, meta?: object }
- Conventions: HTTP codes 200/201/204 success, 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict (email duplicate), 429 rate limit, 500 unexpected.

- POST /api/auth/login
  - 200: { data: { token, user: UserDTO } }
  - 400: { error: { code: "VALIDATION_ERROR", message: "Invalid credentials payload", details: [ { field: "email", message: "Email required" } ] } }
  - 401: { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } }
  - 429: { error: { code: "RATE_LIMITED", message: "Too many login attempts" } }

- GET /api/users
  - 200: { data: UserDTO[], meta: { page, pageSize, total } }
  - 401/403: { error: { code: "UNAUTHORIZED", message: "Token missing or forbidden" } }

- POST /api/users
  - 201: { data: UserDTO }
  - 400: { error: { code: "VALIDATION_ERROR", message: "Invalid user payload", details: [ { field: "email", message: "Email already taken" } ] } }
  - 409: { error: { code: "DUPLICATE_EMAIL", message: "Email already exists" } }

- GET /api/users/:id
  - 200: { data: UserDTO }
  - 404: { error: { code: "NOT_FOUND", message: "User not found" } }

- PATCH /api/users/:id
  - 200: { data: UserDTO }
  - 400: { error: { code: "VALIDATION_ERROR", message: "No valid fields provided" } }
  - 404: { error: { code: "NOT_FOUND", message: "User not found" } }

- PATCH /api/users/:id/password
  - 200: { data: { ok: true } }
  - 400: { error: { code: "VALIDATION_ERROR", message: "Invalid password payload", details: [ { field: "newPassword", message: "Password too weak" } ] } }
  - 401/403: { error: { code: "UNAUTHORIZED", message: "Not allowed to change this password" } }

- DELETE /api/users/:id
  - 200: { data: { ok: true } }
  - 404: { error: { code: "NOT_FOUND", message: "User not found" } }

## Sequencing (milestones)
1) Backend groundwork: define User schema/model, indexes, validation schemas, password hashing utility, JWT secret config.
2) AuthZ: authorize middleware con matriz de roles; migrar login a modelo real; agregar audit logger hook.
3) User API: CRUD + update password; paginacion/filtros; tests de integracion (router/controller con supertest + Mongo en memoria).
4) Frontend /users: vista unica con tabla + filtros + modal create/edit; API client con envelopes; signals store; guard de rol.
5) UI modal y acciones: validar formulario, focus management, confirm dialogs; refresco optimista; unit tests de servicios y e2e happy path (listar -> crear -> editar -> desactivar/reactivar).

## Risks & Mitigations
- Weak auth/role enforcement: ensure all user routes require JWT + role-based authorize; add tests for forbidden paths and token expiry; avoid fake users (use DB lookup and hashed passwords only).
- Insecure password handling: enforce bcrypt with strong cost, validate password strength, never log secrets, require HTTPS (secure cookies sameSite=strict), add rate limiting on login; provide password-reset flow tokenized later.
