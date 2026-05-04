# Feature: Usuarios - Registro de Cambios

## Estado: COMPLETADA (2026-05-01)

---

## Cambios Implementados

### Backend

- CRUD usuarios (global + tenant)
- Cambio de contraseña privilegiado (admin/superadmin)
- Solicitud de cambio de contraseña
- Login attempt logging (servicio existente)
- **NUEVO** Endpoint: `GET /api/login-attempts` - consulta intentos de login (superadmin)

### Frontend - Rutas y Guards

- `tenant-admin.guard.ts` (NUEVO) - protege `/app/:tenantId/users`, solo admin/superadmin
- `tenant-privileged.guard.ts` - protege `/app/:tenantId/audit` y `/history`, solo admin/operator
- Route protection aplicada en `tenant-layout.routes.ts`

### Frontend - Menú Sidebar

- `Usuarios` solo visible para rol `admin`
- `audit/history` visible para admin/operator
- `viewer` no ve opciones privilegiadas

### Frontend - Tabla de Usuarios

- Columna "Acciones" según rol (admin/operator/superadmin)
- Botones: Editar, Suspender/Reactivar
- `viewer` solo ve datos (sin acciones)

### Frontend - Modal de Detalle Usuario

- `Cambiar contraseña` (por rol: superadmin → cualquier usuario, admin → operator/viewer)
- `Solicitar cambio al super-admin` (admin → operator/viewer)
- Ya NO incluye Suspender/Reactivar (solo en tabla)

### Frontend - Login Attempts UI (NUEVO)

- Ruta: `/admin/login-attempts`
- Página: `super-admin/login-attempts/pages/login-attempts/login-attempts.ts`
- API: `super-admin/login-attempts/services/login-attempts-api.ts`
- Filtros: email, success (true/false), limit

### Frontend - Auth Fixes

- Redirección post-login por rol (super-admin → /admin/dashboard, tenant → /app/:clientId/dashboard)
- Refresh interceptor ahora solo reintenta en 401 (no 403)
- Navegación tenant normalizada a `/app/:tenantId/...`
- Menú filtrado por rol

---

## Pendiente (No implementado)

1. **UI para resolver password change requests**
   - Superadmin poder aprobar/rechazar solicitudes
   - Endpoint existe: `POST /api/users/:id/password-change-requests/:reqId/resolve`
   - Falta página frontend

2. **Tests específicos**
   - Login attempt routes test
   - Coverage para nuevo endpoint

3. **QA manual**
   - Verificar flujos por cada rol
   - Verificar redirects de guards

---

## VALIDACIÓN

- Backend tests: `npm run test` → 104 passed
- Frontend build: `npx ng build` → OK (warning budget preexistente)