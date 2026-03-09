import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { HomeData } from '../services/home-data';
import { HomeApiPreview, HomeHighlights, HomeStackRoadmap, IHeroHeaderConfig } from '../components';
import { IApiPreview } from '../interfaces/api-preview';
import { ButtonModule } from 'primeng/button';
import { HomeHeroHeader } from '../../../shared/hero-header/hero-header';

@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule, HomeHighlights, HomeApiPreview, HomeStackRoadmap, HomeHeroHeader ],
  template: `
    <main class="min-h-screen bg-surface-50 text-surface-900">
      <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">

        <app-home-hero-header [config]="headerConfig()" />

        <p-card styleClass="shadow-2">
          <app-home-highlights [cardContent]="cardContent" />
        </p-card>

        <app-home-api-preview [apiPreview]="apiPreview()" />

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

  protected readonly cardContent = this.homeData.cardContent;
  protected readonly headerConfig = this.homeData.headerConfig;
  protected readonly apiPreview = this.homeData.apiPreview;

  protected readonly projectName = 'Mean Admin';
  protected readonly subTitle = 'Panel integral para operaciones en tiempo real'

}
