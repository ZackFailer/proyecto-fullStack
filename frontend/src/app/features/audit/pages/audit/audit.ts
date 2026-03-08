import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-audit-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Auditoría y Conciliaciones" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuditPage {}
