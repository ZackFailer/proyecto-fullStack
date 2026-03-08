import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-users-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Gestión de Usuarios" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPage {}
