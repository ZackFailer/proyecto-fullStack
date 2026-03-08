import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnderConstruction } from '../../../../shared/under-construction/under-construction';

@Component({
  selector: 'app-bulk-upload-page',
  imports: [UnderConstruction],
  template: `
    <app-under-construction featureName="Carga masiva" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BulkUploadPage {}
