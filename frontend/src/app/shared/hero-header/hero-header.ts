import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

export interface IHeroHeaderConfig {
  title: string
  subTitle: string
  route?: IButtonRoute[]
}

export interface IButtonRoute {
  label?: string
  icon?: string
  buttonStyle?: string
  route: string
}

@Component({
  selector: 'app-home-hero-header',
  template: `
    <div class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30">
          <i class="pi pi-chart-line text-xl"></i>
        </span>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">{{config().title}}</p>
          <p class="text-sm text-surface-500">{{config().subTitle}}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        @for (route of config().route; track $index) {
          <p-button [label]="route.label ?? '' " [icon]="route.icon ?? 'pi pi-compass' " [styleClass]="route.buttonStyle ?? 'buttonp-button-outlined p-button-sm' " [routerLink]="[route.route]"></p-button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule]
})
export class HomeHeroHeader {
  public config = input.required<IHeroHeaderConfig>();
}
