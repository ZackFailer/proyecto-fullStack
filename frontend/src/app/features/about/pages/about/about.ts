import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-about',
  imports: [RouterLink, CardModule, ButtonModule, ChipModule, TagModule, DividerModule, PanelModule],
  template: `
    <main class="min-h-screen bg-surface-50 text-surface-900">
      <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <p-card styleClass="shadow-2 border border-surface-200">
          <ng-template pTemplate="header">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-3">
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30">
                  <i class="pi pi-info-circle text-xl"></i>
                </span>
                <div>
                  <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">About / Mean Admin</p>
                  <p class="text-sm text-surface-500">Visión, craft y cómo colaborar</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <p-button label="Dashboard" icon="pi pi-home" styleClass="p-button-outlined p-button-sm" [routerLink]="['/']"></p-button>
                <p-button label="Login" icon="pi pi-sign-in" styleClass="p-button-success p-button-sm" [routerLink]="['/login']"></p-button>
              </div>
            </div>
          </ng-template>

          <div class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div class="space-y-3">
              <h1 class="text-3xl font-bold leading-tight md:text-4xl">Visión, craft y evolución del panel.</h1>
              <p class="text-base text-surface-600">Propósito, decisiones técnicas y quién está detrás. Entiende rápido el alcance, estado y cómo sumar.</p>
              <div class="flex flex-wrap gap-2">
                <p-chip label="MEAN" icon="pi pi-sitemap"></p-chip>
                <p-chip label="Angular 21" icon="pi pi-bolt"></p-chip>
                <p-chip label="PrimeNG" icon="pi pi-prime"></p-chip>
                <p-chip label="JWT" icon="pi pi-shield"></p-chip>
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <p-card header="Propósito" styleClass="shadow-none border border-surface-200">
                <p class="text-sm text-surface-700">Panel MEAN desacoplado para usuarios, inventario y auditoría.</p>
              </p-card>
              <p-card header="Estado" styleClass="shadow-none border border-surface-200">
                <p class="text-sm text-surface-700">En progreso: usuarios y dashboards. Próximo: carga masiva y conciliaciones.</p>
              </p-card>
              <p-card header="Stack" styleClass="shadow-none border border-surface-200">
                <p class="text-sm text-surface-700">Angular 21 + Signals, PrimeNG 21, Tailwind v4, Express 5, MongoDB.</p>
              </p-card>
              <p-card header="API" styleClass="shadow-none border border-surface-200">
                <p class="text-sm text-surface-700">Envelope JSON unificado en todas las rutas.</p>
              </p-card>
            </div>
          </div>
        </p-card>

        <p-card styleClass="shadow-1 border border-surface-200">
          <ng-template pTemplate="title">Decisiones técnicas y valores</ng-template>
          <div class="grid gap-6 md:grid-cols-[1fr_0.9fr]">
            <div class="space-y-3">
              <p-tag value="Cómo está construido" severity="info"></p-tag>
              <ul class="space-y-2 text-sm text-surface-700">
                <li><span class="font-semibold text-emerald-700">Frontend:</span> Angular 21 standalone + Signals, PrimeNG 21, Tailwind v4 para velocidad y consistencia.</li>
                <li><span class="font-semibold text-emerald-700">Backend:</span> Express 5, MongoDB/Mongoose, JWT con cookies seguras y middlewares.</li>
                <li><span class="font-semibold text-emerald-700">DX y calidad:</span> tsx + nodemon, tipado estricto, envelope JSON común, logging con morgan.</li>
              </ul>
              <p-panel header="Por qué este setup" [toggleable]="false" styleClass="shadow-none border border-emerald-100 bg-emerald-50">
                <p class="text-sm text-emerald-900">Refleja flujos reales de productos admin: estado reactivo con Signals, tablas ricas con PrimeNG, y un backend con autenticación lista para producción.</p>
              </p-panel>
            </div>
            <div class="space-y-4">
              <p-tag value="Hoja de ruta" severity="success"></p-tag>
              <div class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <ol class="space-y-2 text-sm text-surface-700">
                  <li><span class="font-semibold text-emerald-700">Ahora:</span> Gestión de usuarios/perfiles, dashboards con métricas clave.</li>
                  <li><span class="font-semibold text-emerald-700">Siguiente:</span> Carga masiva de productos, conciliaciones y auditoría extendida.</li>
                  <li><span class="font-semibold text-emerald-700">Meta:</span> Flujo end-to-end con trazabilidad completa y suite de tests.</li>
                </ol>
              </div>
              <div class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-surface-900">Valores de diseño</p>
                <p-divider></p-divider>
                <ul class="space-y-2 text-sm text-surface-700">
                  <li>Acentos esmeralda/teal sobre base clara para legibilidad.</li>
                  <li>Componentes pequeños y reutilizables; Signals para estado local.</li>
                  <li>Respuesta API coherente para DX y monitoreo.</li>
                </ul>
              </div>
            </div>
          </div>
        </p-card>

        <p-card styleClass="shadow-2 border border-surface-200">
          <ng-template pTemplate="title">Sobre mí y colaboración</ng-template>
          <div class="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div class="space-y-3">
              <p-tag value="Autor" severity="warn"></p-tag>
              <h3 class="text-2xl font-semibold text-surface-900">Paul Joseph Quintero Caraballo</h3>
              <p class="text-sm text-surface-700">Desarrollador Front-end e Ingeniero en Informática. Interfaces efectivas con Angular y Figma, liderando prototipado y mejorando eficiencia en equipos cross-functional.</p>
              <p-divider></p-divider>
              <div class="space-y-3 text-sm text-surface-800">
                <div>
                  <p class="font-semibold text-emerald-700">Experiencia reciente</p>
                  <ul class="mt-1 space-y-1">
                    <li><span class="font-semibold">ABSoftware (05/2025–Presente):</span> Prototipado (Figma, Lovable), componentes modulares con Angular, coordinación en Azure DevOps.</li>
                    <li><span class="font-semibold">Inapymi (09/2024–12/2024):</span> App web con Laravel; modelado y planificación de BD.</li>
                  </ul>
                </div>
                <div>
                  <p class="font-semibold text-emerald-700">Enfoque técnico</p>
                  <p>Angular/TypeScript, Tailwind, PrimeNG, Node/Express, MongoDB. Azure DevOps, GitHub, diseño en Figma. Inglés B1.</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <p-tag value="Contacto" severity="info"></p-tag>
              <div class="grid gap-2 sm:grid-cols-2">
                <a pButton label="GitHub" icon="pi pi-github" class="p-button-outlined w-full" href="https://github.com/ZackFailer" target="_blank" rel="noopener noreferrer"></a>
                <a pButton label="LinkedIn" icon="pi pi-linkedin" class="p-button-outlined w-full" href="https://www.linkedin.com/in/paul-joseph-quintero-caraballo-53437b309" target="_blank" rel="noopener noreferrer"></a>
                <a pButton label="Ver CV" icon="pi pi-id-card" class="p-button-outlined w-full" href="https://zackfailer.github.io/CV/" target="_blank" rel="noopener noreferrer"></a>
                <a pButton label="Repositorio" icon="pi pi-code" class="p-button-outlined w-full" href="https://github.com/ZackFailer/proyecto-fullStack" target="_blank" rel="noopener noreferrer"></a>
              </div>
              <p-panel header="Feedback / Contribuciones" [toggleable]="false" styleClass="shadow-none border border-emerald-100 bg-emerald-50">
                <p class="text-sm text-emerald-900">¿Tienes ideas o hallazgos? Abre un issue, comparte métricas o UX feedback. Toda mejora suma al flujo end-to-end.</p>
              </p-panel>
            </div>
          </div>
        </p-card>
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class About { }
