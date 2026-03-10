import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IAboutHeader } from '../../interfaces/about';

@Component({
  selector: 'app-about-header',
  template: `
    <div class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30">
          <i [class]="header().icon + ' text-xl'"></i>
        </span>
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">{{ header().context }}</p>
          <p class="text-sm text-surface-500">{{ header().description }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        @for (action of header().actions; track action.route) {
          <p-button [label]="action.label" [icon]="action.icon" [styleClass]="action.buttonStyle ?? 'p-button-outlined p-button-sm'" [routerLink]="[action.route]"></p-button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule]
})
export class AboutHeader {
  public readonly header = input.required<IAboutHeader>();
}
