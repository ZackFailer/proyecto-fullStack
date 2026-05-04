import { ChangeDetectionStrategy, Component, Signal, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChipList, IChipItem } from '../../../../../shared/chips/chip-list';
import { SimpleCard, ICardProvs } from '../../../../../shared/card/card';

@Component({
  selector: 'app-home-highlights',
  template: `
    <div class="space-y-4">

      <h1 class="text-3xl font-bold leading-tight md:text-4xl">Una consola moderna para administrar usuarios, inventario y flujos críticos sin perder visibilidad.</h1>

      <app-chip-list [chips]="techChips" />

      <p class="text-base mt-4 text-surface-600">Dashboard diseñado para equipos que requieren trazabilidad, seguridad con JWT y operaciones rápidas sobre MongoDB. Arquitectura desacoplada MEAN, componentes standalone y Signals para reactividad precisa.</p>

      <div class="grid gap-3 md:grid-cols-3">
        @if (cards().length) {
          @for (card of cards(); track card.title) {
            <app-simple-card [cardProvs]="card" />
          }
        }
      </div>

    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ ButtonModule, ChipList, SimpleCard ]
})
export class HomeHighlights {
  cardContent = input.required<Signal<ICardProvs[] | null>>();

  protected readonly techChips: ReadonlyArray<IChipItem> = [
    { label: 'Angular 21', icon: 'pi pi-bolt' },
    { label: 'PrimeNG 21', icon: 'pi pi-prime' },
    { label: 'Tailwind v4', icon: 'pi pi-sliders-h' },
    { label: 'MongoDB', icon: 'pi pi-database' },
  ];

  protected readonly cards = computed(() => (this.cardContent()?.() ?? []).filter((card): card is ICardProvs => Boolean(card)));
}
