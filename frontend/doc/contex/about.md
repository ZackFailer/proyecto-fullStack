# About Page Structure (versión enriquecida)

Ruta del componente: frontend/src/app/features/about/pages/about/about.ts

## Layout
- Tema claro, base blanca; contenedor max-w-6xl con padding 12–16.
- Encabezado tipo hero en bloque (no idéntico a Home): headline, descripción y CTA, acompañado de un snapshot lateral.
- Secciones en tarjetas amplias (bordes suaves, sombras ligeras) con grids 2 cols en desktop, 1 col en mobile.

## Secciones y contenido
1) Hero / Presentación
- Título: "Visión, craft y evolución del panel." 
- Texto: propósito de la página (porqué, decisiones y cómo colaborar) y CTAs a Dashboard/Login.
- Snapshot rápido (4 cards): Propósito, Estado, Stack, Respuesta API.

2) Decisiones técnicas & Roadmap
- Lista de decisiones clave: Frontend (Angular 21 standalone + Signals, PrimeNG 21, Tailwind v4), Backend (Express 5, MongoDB/Mongoose, JWT + cookies seguras), DX (tsx, nodemon, envelope JSON unificado, logging morgan).
- Caja "Por qué este setup" (resalta Signals, tablas ricas, auth lista para prod).
- Hoja de ruta en lista ordenada (Ahora, Siguiente, Meta) y tarjeta de valores de diseño (paleta, componentes pequeños, coherencia API).

3) Sobre mí (enriquecido desde CV)
- Nombre: Paul Joseph Quintero Caraballo. Rol: Desarrollador Front-end / Ingeniero en Informática.
- Resumen: Angular + Figma, prototipado, incremento de eficiencia en equipos cross-functional.
- Experiencia reciente: ABSoftware (05/2025–Presente, prototipado Figma/Lovable, Angular modular, Azure DevOps) y Inapymi (09/2024–12/2024, app Laravel, modelado BD).
- Enfoque técnico: Angular/TS, Tailwind/PrimeNG, Node/Express, MongoDB; Azure DevOps, GitHub; diseño en Figma; Inglés B1.

4) Contacto / Colaboración
- Botones: GitHub, LinkedIn, Ver CV (https://zackfailer.github.io/CV/), Repositorio. Todos `target="_blank" rel="noopener noreferrer"`.
- Caja de feedback: invita a abrir issues/ideas/bugs.

## Notas de estilo
- Paleta clara con acentos esmeralda/teal; tarjetas en blanco y slate-50.
- Component standalone, ChangeDetectionStrategy.OnPush, RouterLink para navegación interna.
- Copy diferenciado del Home para evitar duplicidad visual y narrativa.
