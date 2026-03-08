import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { HomeData } from '../services/home-data';
import { HomeApiPreview, HomeDemoSignals, HomeHighlights, HomeStackRoadmap } from '../components';
import { IApiPreview } from '../interfaces/api-preview';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule, RouterLink, HomeHighlights, HomeApiPreview, HomeDemoSignals, HomeStackRoadmap],
  template: `
    <main class="min-h-screen bg-surface-50 text-surface-900">
      <div class="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-12 md:py-16">
        <div class="flex flex-wrap gap-2 justify-end mr-5">
          <p-button label="Roadmap" icon="pi pi-compass" styleClass="p-button-outlined p-button-sm" [routerLink]="['/about']"></p-button>
          <p-button label="Ingresar" icon="pi pi-sign-in" styleClass="p-button-success p-button-sm" [routerLink]="['/login']"></p-button>
        </div>
        <p-card styleClass="shadow-2">

          <app-home-highlights [cardContent]="cardContent" />

        </p-card>

        <div class="">
          <app-home-api-preview [apiPreview]="apiPreview" />

          <!-- <app-home-demo-signals [payload]="apiPreview" /> -->
        </div>

        <!-- <div class="flex flex-wrap justify-center gap-2">
          <p-button label="Roadmap" icon="pi pi-compass" styleClass="p-button-outlined p-button-sm" [routerLink]="['/about']"></p-button>
          <p-button label="Ingresar" icon="pi pi-sign-in" styleClass="p-button-success p-button-sm" [routerLink]="['/login']"></p-button>
        </div> -->

        <app-home-stack-roadmap />
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
  protected readonly cardContent = this.homeData.cardContent;

  protected get apiPreview(): IApiPreview {
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
