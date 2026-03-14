import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { IAboutAuthor } from '../../interfaces/about';

@Component({
  selector: 'app-about-author',
  template: `
    <div class="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
      <div class="space-y-3">
        <p-tag value="Autor" severity="warn"></p-tag>
        <h3 class="text-2xl font-semibold text-surface-900">{{ author().name }}</h3>
        <p class="text-sm text-surface-700">{{ author().role }}</p>
        <p class="text-sm text-surface-700">{{ author().summary }}</p>
        @if (author().expertise) {
          <p class="text-sm text-surface-800">{{ author().expertise }}</p>
        }
        <p-divider></p-divider>
        <div class="space-y-3 text-sm text-surface-800">
          <div>
            <p class="font-semibold text-emerald-700">Experiencia reciente</p>
            <ul class="mt-1 space-y-1">
              @for (exp of author().experiences; track exp.title) {
                <li><span class="font-semibold">{{ exp.title }}:</span> {{ exp.detail }}</li>
              }
            </ul>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <p-tag value="Contacto" severity="info"></p-tag>
        <div class="grid gap-2 sm:grid-cols-2">
          @for (link of author().contacts; track link.href) {
            <a pButton class="p-button-outlined w-full" [label]="link.label" [icon]="link.icon ?? ''" [href]="link.href" target="_blank" rel="noopener noreferrer"></a>
          }
        </div>
        <p-panel header="Feedback / Contribuciones" [toggleable]="false" styleClass="shadow-none border border-emerald-100 bg-emerald-50">
          <p class="text-sm text-emerald-900">{{ author().feedback }}</p>
        </p-panel>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule, DividerModule, ButtonModule, PanelModule]
})
export class AboutAuthor {
  public readonly author = input.required<IAboutAuthor>();
}
