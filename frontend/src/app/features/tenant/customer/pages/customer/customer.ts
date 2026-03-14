import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-customer-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Clientes comerciales" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CustomerPage {}
