import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-provider-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Proveedores" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProviderPage {}
