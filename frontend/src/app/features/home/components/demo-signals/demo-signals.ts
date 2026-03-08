import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { IApiPreview } from '../../interfaces/api-preview';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-home-demo-signals',
  template: `
    <p-card header="Demo Signals" styleClass="shadow-none border border-surface-200">
      <div class="rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-emerald-900">
        <pre class="whitespace-pre-wrap break-words">{{ payload() | json }}</pre>
      </div>
    </p-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, JsonPipe, DividerModule]
})
export class HomeDemoSignals {
  payload = input.required<IApiPreview>();
}
