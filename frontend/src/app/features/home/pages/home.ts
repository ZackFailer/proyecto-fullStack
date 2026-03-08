import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HomeData } from '../services/home-data';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';

type ApiPreview = {
  success: boolean;
  message: string;
  data: {
    productos: number;
    alertasStock: number;
    usuario: string;
  };
};

@Component({
  selector: 'app-home',
  imports: [JsonPipe, RouterLink, CardModule, ButtonModule, ChipModule, TagModule, DividerModule, PanelModule],
  template: `
    <main class="min-h-screen bg-surface-50 text-surface-900">
      <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <p-card styleClass="shadow-2">
          <ng-template pTemplate="header">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-3">
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30">
                  <i class="pi pi-chart-line text-xl"></i>
                </span>
                <div>
                  <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">Mean Admin</p>
                  <p class="text-sm text-surface-500">Panel integral para operaciones en tiempo real</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <p-button label="Roadmap" icon="pi pi-compass" styleClass="p-button-outlined p-button-sm" [routerLink]="['/about']"></p-button>
                <p-button label="Ingresar" icon="pi pi-sign-in" styleClass="p-button-success p-button-sm" [routerLink]="['/login']"></p-button>
              </div>
            </div>
          </ng-template>

          <div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <p-chip label="Angular 21" icon="pi pi-bolt"></p-chip>
                <p-chip label="PrimeNG 21" icon="pi pi-prime"></p-chip>
                <p-chip label="Tailwind v4" icon="pi pi-sliders-h"></p-chip>
                <p-chip label="MongoDB" icon="pi pi-database"></p-chip>
              </div>
              <h1 class="text-3xl font-bold leading-tight md:text-4xl">Una consola moderna para administrar usuarios, inventario y flujos críticos sin perder visibilidad.</h1>
              <p class="text-base text-surface-600">Dashboard diseñado para equipos que requieren trazabilidad, seguridad con JWT y operaciones rápidas sobre MongoDB. Arquitectura desacoplada MEAN, componentes standalone y Signals para reactividad precisa.</p>
              <div class="flex flex-wrap gap-2">
                <p-button label="Ir al panel" icon="pi pi-play" styleClass="p-button-success" [routerLink]="['/login']"></p-button>
                <p-button label="Ver detalles" icon="pi pi-info-circle" styleClass="p-button-outlined" [routerLink]="['/about']"></p-button>
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <p-card header="Inventario" subheader="Stock en tiempo real" styleClass="shadow-none border border-surface-200">
                  <p class="text-sm text-surface-600">Catálogo completo con filtros y señales para estados inmediatos.</p>
                </p-card>
                <p-card header="Seguridad" subheader="JWT + Roles" styleClass="shadow-none border border-surface-200">
                  <p class="text-sm text-surface-600">Autenticación robusta con cookies seguras y guardas enrutadas.</p>
                </p-card>
                <p-card header="Auditoría" subheader="Historial trazable" styleClass="shadow-none border border-surface-200">
                  <p class="text-sm text-surface-600">Registros listos para conciliaciones y control operativo.</p>
                </p-card>
              </div>
            </div>

            <div class="space-y-4">
              <p-panel header="Preview del API" [toggleable]="false" styleClass="shadow-none border border-surface-200">
                <div class="flex items-center gap-2 text-xs text-surface-600">
                  <p-tag severity="success" value="Envelope unificado"></p-tag>
                  <span class="text-surface-500">Consistencia para monitoreo y DX</span>
                </div>
                <p-divider></p-divider>
                <div class="rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-emerald-900">
                  <pre class="whitespace-pre-wrap break-words">{{ apiPreview | json }}</pre>
                </div>
              </p-panel>

              <p-card header="Demo Signals" styleClass="shadow-none border border-surface-200">
                <p class="text-sm text-surface-600">Mensaje: <span class="font-semibold text-emerald-700">{{ message() || 'Conectando con API...' }}</span></p>
                <p class="text-sm text-surface-600">Payload:</p>
                <div class="rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-emerald-900">
                  <pre class="whitespace-pre-wrap break-words">{{ data() | json }}</pre>
                </div>
              </p-card>
            </div>
          </div>
        </p-card>

        <p-card styleClass="shadow-1 border border-surface-200">
          <ng-template pTemplate="title">Stack y Roadmap</ng-template>
          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <p-tag value="Frontend" severity="info"></p-tag>
              <ul class="text-sm text-surface-700 space-y-1">
                <li>Angular 21 standalone + Signals</li>
                <li>PrimeNG 21 + PrimeUIX themes</li>
                <li>Tailwind CSS v4 utilitario</li>
              </ul>
            </div>
            <div class="space-y-2">
              <p-tag value="Backend" severity="warn"></p-tag>
              <ul class="text-sm text-surface-700 space-y-1">
                <li>Node.js + Express 5</li>
                <li>MongoDB + Mongoose</li>
                <li>JWT, cookies seguras, middlewares</li>
              </ul>
            </div>
            <div class="space-y-2">
              <p-tag value="Roadmap" severity="success"></p-tag>
              <ul class="text-sm text-surface-700 space-y-1">
                <li>Gestión de usuarios y perfiles</li>
                <li>Carga masiva y conciliaciones</li>
                <li>Dashboards con métricas en tiempo real</li>
              </ul>
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
export default class Home {
  private readonly homeData = inject(HomeData);

  protected readonly data = this.homeData.data;
  protected readonly message = this.homeData.message;
  protected readonly username = this.homeData.username;

  protected get apiPreview(): ApiPreview {
    return {
      success: true,
      message: 'Inventario sincronizado',
      data: {
        productos: 128,
        alertasStock: 6,
        usuario: this.username() || 'admin',
      },
    };
  }
}
