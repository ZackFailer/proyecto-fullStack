import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-clients-providers-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Clientes y Proveedores" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClientsProvidersPage {}
