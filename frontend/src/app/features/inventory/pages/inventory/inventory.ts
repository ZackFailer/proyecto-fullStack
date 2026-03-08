import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-inventory-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Inventario" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InventoryPage {}
