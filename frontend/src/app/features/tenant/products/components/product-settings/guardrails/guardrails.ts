import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-product-guardrails',
  template: `
    <div class="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-none">
      <p class="font-semibold text-emerald-800">Guardrails y validaciones</p>
      <p-divider />
      <ul class="space-y-2">
        @for (item of guardrails(); track item) {
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-emerald-600">•</span>
            <span>{{ item }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `:host { display: block; width: 100%; }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DividerModule]
})
export class ProductGuardrails {
  readonly guardrails = input.required<ReadonlyArray<string>>();
}
