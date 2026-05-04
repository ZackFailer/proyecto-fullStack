import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { IProductAttribute, IProductType } from '../../../interfaces/product-settings';

@Component({
  selector: 'app-product-attributes',
  template: `
    @if (productType()) {
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 text-sm text-surface-600">
          <p-tag [value]="'v' + productType()!.version" severity="info"></p-tag>
          <p-tag [value]="productType()!.status === 'published' ? 'Publicado' : 'Borrador'" [severity]="productType()!.status === 'published' ? 'success' : 'warn'"></p-tag>
          <span class="text-xs text-surface-500">Orden y validación se sincronizan con carga masiva y formularios dinámicos.</span>
        </div>

        <div class="grid gap-2">
          @for (attr of sortedAttributes(); track attr.key) {
            <p-panel [toggleable]="false" styleClass="shadow-none border border-surface-200 bg-surface-0">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-surface-900">{{ attr.label }}</p>
                  <p class="text-xs text-surface-600">{{ attr.key }} · Tipo: {{ attr.type }}</p>
                  @if ((attr.options?.length ?? 0) > 0) {
                    <p class="text-xs text-surface-600">Opciones: {{ (attr.options ?? []).join(', ') }}</p>
                  }
                </div>
                <div class="flex flex-wrap gap-2">
                  <p-tag [value]="attr.required ? 'Requerido' : 'Opcional'" [severity]="attr.required ? 'danger' : 'info'"></p-tag>
                  <p-tag [value]="'Orden ' + attr.order" severity="secondary"></p-tag>
                  <p-tag [value]="'v' + attr.version" severity="success"></p-tag>
                  <p-tag [value]="attr.isDeprecated ? 'Deprecated' : 'Activo'" [severity]="attr.isDeprecated ? 'warn' : 'success'"></p-tag>
                </div>
              </div>
            </p-panel>
          }
        </div>
      </div>
    } @else {
      <div class="text-sm text-surface-600">Selecciona un tipo de producto para ver sus atributos.</div>
    }
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule, DividerModule, PanelModule]
})
export class ProductAttributes {
  readonly productType = input<IProductType | null>(null);
  readonly sortedAttributes = computed<ReadonlyArray<IProductAttribute>>(() => {
    const attrs = this.productType()?.attributes ?? [];
    return [...attrs].sort((a, b) => a.order - b.order);
  });
}
