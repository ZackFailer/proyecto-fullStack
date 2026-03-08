import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipModule } from 'primeng/chip';

export interface IChipItem {
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-chip-list',
  template: `
    <div class="flex flex-wrap gap-2">
      @for (chip of chips(); track chip.label) {
        <p-chip [label]="chip.label" [icon]="chip.icon"></p-chip>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipModule]
})
export class ChipList {
  chips = input.required<ReadonlyArray<IChipItem>>();
}
