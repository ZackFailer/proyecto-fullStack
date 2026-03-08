import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home-hero-header',
  template: `
    <div class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-end">
      <!-- <div class="flex items-center gap-3"> -->
        <!-- <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30">
          <i class="pi pi-chart-line text-xl"></i>
        </span> -->
        <!-- <div>
          <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">Mean Admin</p>
          <p class="text-sm text-surface-500">Panel integral para operaciones en tiempo real</p>
        </div> -->
      <!-- </div> -->
      <div class="flex flex-wrap gap-2">
        <p-button label="Roadmap" icon="pi pi-compass" styleClass="p-button-outlined p-button-sm" [routerLink]="['/about']"></p-button>
        <p-button label="Ingresar" icon="pi pi-sign-in" styleClass="p-button-success p-button-sm" [routerLink]="['/login']"></p-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule]
})
export class HomeHeroHeader {}
