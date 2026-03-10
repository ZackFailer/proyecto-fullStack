import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IProductType } from '../../interfaces/product-settings';

@Component({
  selector: 'app-product-type-list',
  template: `
    <div class="grid gap-3 md:grid-cols-2">
      @for (type of types(); track type.id) {
        <p-card styleClass="shadow-1 border border-surface-200" [header]="type.name">
          <div class="flex flex-wrap items-center gap-2 text-sm text-surface-600 mb-2">
            <p-tag [value]="'v' + type.version" severity="info"></p-tag>
            <p-tag [value]="type.status === 'published' ? 'Publicado' : 'Borrador'" [severity]="type.status === 'published' ? 'success' : 'warn'"></p-tag>
            <p-tag [value]="type.isActive ? 'Activo' : 'Inactivo'" [severity]="type.isActive ? 'success' : 'danger'"></p-tag>
            <span class="text-xs text-surface-500">Última publicación: {{ type.lastPublishedAt }}</span>
          </div>
          <div class="flex flex-wrap gap-2 text-sm text-surface-700">
            <span class="pill">{{ type.attributes.length }} atributos</span>
            <span class="pill">{{ deprecatedCount(type) }} deprecados</span>
          </div>
          <div class="mt-3 flex justify-end">
            <p-button size="small" [label]="selectedId() === type.id ? 'Seleccionado' : 'Ver atributos'" [severity]="selectedId() === type.id ? 'success' : 'secondary'" [outlined]="selectedId() !== type.id" icon="pi pi-list" (onClick)="selectType.emit(type.id)" />
          </div>
        </p-card>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: var(--surface-100, #f3f4f6);
      color: var(--text-color-secondary);
      font-size: 0.78rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, TagModule, ButtonModule]
})
export class ProductTypeList {
  readonly types = input.required<ReadonlyArray<IProductType>>();
  readonly selectedId = input<string>('');
  readonly selectType = output<string>();

  protected deprecatedCount(type: IProductType): number {
    return type.attributes.filter(attr => Boolean(attr.isDeprecated)).length;
  }
}
