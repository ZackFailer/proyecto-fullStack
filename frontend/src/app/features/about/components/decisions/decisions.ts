import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { IAboutDecisions } from '../../interfaces/about';

@Component({
  selector: 'app-about-decisions',
  template: `
    <div class="grid gap-6 md:grid-cols-[1fr_0.9fr]">
      <div class="space-y-3">
        <p-tag value="Cómo está construido" severity="info"></p-tag>
        <ul class="space-y-2 text-sm text-surface-700">
          @for (decision of decisions().decisions; track decision.label) {
            <li><span class="font-semibold text-emerald-700">{{ decision.label }}:</span> {{ decision.detail }}</li>
          }
        </ul>
        <p-panel header="Por qué este setup" [toggleable]="false" styleClass="shadow-none border border-emerald-100 bg-emerald-50">
          <p class="text-sm text-emerald-900">{{ decisions().justification }}</p>
        </p-panel>
      </div>
      <div class="space-y-4">
        <p-tag value="Hoja de ruta" severity="success"></p-tag>
        <div class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
          <ol class="space-y-2 text-sm text-surface-700">
            @for (item of decisions().roadmap; track item.label) {
              <li><span class="font-semibold text-emerald-700">{{ item.label }}:</span> {{ item.detail }}</li>
            }
          </ol>
        </div>
        <div class="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-surface-900">Valores de diseño</p>
          <p-divider></p-divider>
          <ul class="space-y-2 text-sm text-surface-700">
            @for (value of decisions().values; track value) {
              <li>{{ value }}</li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule, PanelModule, DividerModule]
})
export class AboutDecisions {
  public readonly decisions = input.required<IAboutDecisions>();
}
