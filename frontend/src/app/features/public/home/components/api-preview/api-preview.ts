import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { IApiPreview } from '../../interfaces/api-preview';

@Component({
  selector: 'app-home-api-preview',
  template: `
    <p-panel header="Preview del API" [toggleable]="false" styleClass="shadow-none border border-surface-200">
      <div class="flex items-center gap-2 text-xs text-surface-600">
        <p-tag severity="success" value="Envelope unificado"></p-tag>
        <span class="text-surface-500">Consistencia para monitoreo y DX</span>
      </div>
      <p-divider />
      <div class="rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-emerald-900">
        <pre class="whitespace-pre-wrap break-words">{{ apiPreview() | json }}</pre>
      </div>
    </p-panel>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelModule, TagModule, DividerModule, JsonPipe]
})
export class HomeApiPreview {
  apiPreview = input.required<IApiPreview>();
}
