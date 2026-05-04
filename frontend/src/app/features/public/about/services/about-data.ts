import { Injectable, signal } from '@angular/core';
import { IAboutAuthor, IAboutDecisions, IAboutHeader, IAboutOverview } from '../interfaces/about';

@Injectable({
  providedIn: 'root'
})
export class AboutData {

  public readonly header = signal<IAboutHeader>({
    context: 'About / Mean Admin',
    description: 'Visión, craft y cómo colaborar',
    icon: 'pi pi-info-circle',
    actions: [
      { label: 'Dashboard', icon: 'pi pi-home', buttonStyle: 'p-button-outlined p-button-sm', route: '/' },
      { label: 'Login', icon: 'pi pi-sign-in', buttonStyle: 'p-button-success p-button-sm', route: '/login' },
    ]
  });

  public readonly overview = signal<IAboutOverview>({
    headline: 'Visión, craft y evolución del panel.',
    subtitle: 'Propósito, decisiones técnicas y quién está detrás. Entiende rápido el alcance, estado y cómo sumar.',
    chips: [
      { label: 'MEAN', icon: 'pi pi-sitemap' },
      { label: 'Angular 21', icon: 'pi pi-bolt' },
      { label: 'PrimeNG', icon: 'pi pi-prime' },
      { label: 'JWT', icon: 'pi pi-shield' },
    ],
    cards: [
      { title: 'Propósito', description: 'Panel MEAN desacoplado para usuarios, inventario y auditoría.' },
      { title: 'Estado', description: 'En progreso: usuarios y dashboards. Próximo: carga masiva y conciliaciones.' },
      { title: 'Stack', description: 'Angular 21 + Signals, PrimeNG 21, Tailwind v4, Express 5, MongoDB.' },
      { title: 'API', description: 'Envelope JSON unificado en todas las rutas.' }
    ]
  });

  public readonly decisions = signal<IAboutDecisions>({
    decisions: [
      { label: 'Frontend', detail: 'Angular 21 standalone + Signals, PrimeNG 21, Tailwind v4 para velocidad y consistencia.' },
      { label: 'Backend', detail: 'Express 5, MongoDB/Mongoose, JWT con cookies seguras y middlewares.' },
      { label: 'DX y calidad', detail: 'tsx + nodemon, tipado estricto, envelope JSON común, logging con morgan.' },
    ],
    justification: 'Refleja flujos reales de productos admin: estado reactivo con Signals, tablas ricas con PrimeNG, y un backend con autenticación lista para producción.',
    roadmap: [
      { label: 'Ahora', detail: 'Gestión de usuarios/perfiles, dashboards con métricas clave.' },
      { label: 'Siguiente', detail: 'Carga masiva de productos, conciliaciones y auditoría extendida.' },
      { label: 'Meta', detail: 'Flujo end-to-end con trazabilidad completa y suite de tests.' },
    ],
    values: [
      'Acentos esmeralda/teal sobre base clara para legibilidad.',
      'Componentes pequeños y reutilizables; Signals para estado local.',
      'Respuesta API coherente para DX y monitoreo.',
    ]
  });

  public readonly author = signal<IAboutAuthor>({
    name: 'Paul Joseph Quintero Caraballo',
    role: 'Desarrollador Front-end e Ingeniero en Informática.',
    summary: 'Interfaces efectivas con Angular y Figma, liderando prototipado y mejorando eficiencia en equipos cross-functional.',
    expertise: 'Angular/TypeScript, Tailwind, PrimeNG, Node/Express, MongoDB. Azure DevOps, GitHub, diseño en Figma. Inglés B1.',
    experiences: [
      { title: 'ABSoftware (05/2025–Presente)', detail: 'Prototipado (Figma, Lovable), componentes modulares con Angular, coordinación en Azure DevOps.' },
      { title: 'Inapymi (09/2024–12/2024)', detail: 'App web con Laravel; modelado y planificación de BD.' },
    ],
    contacts: [
      { label: 'GitHub', icon: 'pi pi-github', href: 'https://github.com/ZackFailer' },
      { label: 'LinkedIn', icon: 'pi pi-linkedin', href: 'https://www.linkedin.com/in/paul-joseph-quintero-caraballo-53437b309' },
      { label: 'Ver CV', icon: 'pi pi-id-card', href: 'https://zackfailer.github.io/CV/' },
      { label: 'Repositorio', icon: 'pi pi-code', href: 'https://github.com/ZackFailer/proyecto-fullStack' },
    ],
    feedback: '¿Tienes ideas o hallazgos? Abre un issue, comparte métricas o UX feedback. Toda mejora suma al flujo end-to-end.'
  });

}
