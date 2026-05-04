# AGENTS.md - OpenCode Sessions

## Comandos principales

```bash
# Desarrollo completo (backend + frontend)
npm run dev

# Backend solo
cd backend && npm run dev    # usa tsx watch
npm run test                 # vitest (backend)
npm run test:watch          # vitest watch mode

# Frontend solo
cd frontend && npm start
```

## Estructura del proyecto

- **Monorepo** con workspaces: `backend/` y `frontend/`
- **Backend**: Express 5 + TypeScript + MongoDB + JWT (ES modules con `.js` en imports)
- **Frontend**: Angular 21 standalone + PrimeNG 21 + Tailwind 4

## Capas del backend

```
routers → controllers → services → models
```

- Usar **JSON envelope responses** `{ success: true, data: ... }`
- Errores propagan a `error.middleware.ts`
- **No hacer commit de `package-lock.json`** (proyecto personal, no equipo)

## Testing

- Backend: **vitest** con supertest para integración
- Tests en `backend/src/__tests__/`
- Ejecutar: `npm run test` o `npm run test:watch`

## Notas importantes

- Angular 21 usa vitest internamente (no es necesario config en frontend)
- ES modules requieren extensiones `.js` en imports
- Validar ObjectIds antes de queries MongoDB
- package-lock.json descartar con `git restore` si no hay equipo