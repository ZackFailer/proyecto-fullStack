import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AboutAuthor, AboutDecisions, AboutHeader, AboutOverview } from '../../components';
import { AboutData } from '../../services/about-data';

@Component({
  selector: 'app-about',
  imports: [CardModule, AboutHeader, AboutOverview, AboutDecisions, AboutAuthor],
  template: `
    <main class="min-h-screen bg-surface-50 text-surface-900">
      <div class="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">

        <app-about-header [header]="header()" />

        <p-card styleClass="shadow-2 border border-surface-200">
          <app-about-overview [overview]="overview()" />
        </p-card>

        <p-card styleClass="shadow-1 border border-surface-200">
          <ng-template pTemplate="title">Decisiones técnicas y valores</ng-template>
          <app-about-decisions [decisions]="decisions()" />
        </p-card>

        <p-card styleClass="shadow-2 border border-surface-200">
          <ng-template pTemplate="title">Sobre mí y colaboración</ng-template>
          <app-about-author [author]="author()" />
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
export default class About {
  private readonly aboutData = inject(AboutData);

  protected readonly header = this.aboutData.header;
  protected readonly overview = this.aboutData.overview;
  protected readonly decisions = this.aboutData.decisions;
  protected readonly author = this.aboutData.author;
}
