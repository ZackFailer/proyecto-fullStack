import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { IAboutOverview } from '../../interfaces/about';

@Component({
  selector: 'app-about-overview',
  template: `
    <div class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <div class="space-y-3">
        <h1 class="text-3xl font-bold leading-tight md:text-4xl">{{ overview().headline }}</h1>
        <div class="flex flex-wrap gap-2">
          @for (chip of overview().chips; track chip.label) {
            <p-chip [label]="chip.label" [icon]="chip.icon"></p-chip>
          }
        </div>
        <p class="text-base text-surface-600">{{ overview().subtitle }}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        @for (card of overview().cards; track card.title) {
          <p-card [header]="card.title" styleClass="shadow-none border border-surface-200">
            <p class="text-sm text-surface-700">{{ card.description }}</p>
          </p-card>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipModule, CardModule]
})
export class AboutOverview {
  public readonly overview = input.required<IAboutOverview>();
}
