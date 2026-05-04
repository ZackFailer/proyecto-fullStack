import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-history-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Historial" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistoryPage {}
