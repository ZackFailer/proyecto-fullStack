import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { CreateProductTypeModal, ProductSettingsToolbar, ProductTypeList, ProductAttributes, ProductGuardrails } from '../components/product-settings';
import { ProductSettingsData } from '../services/product-settings-data';
import { INewProductTypeWithAttributes } from '../interfaces/product-settings';

@Component({
  selector: 'app-product-settings',
  imports: [CardModule, DividerModule, ButtonModule, ProductSettingsToolbar, ProductTypeList, ProductAttributes, ProductGuardrails, CreateProductTypeModal],
  template: `
    <div class="grid gap-4">
      <app-product-settings-toolbar [metrics]="metrics()" (createRequested)="openCreateModal()" />

      <p-card styleClass="shadow-1 border border-surface-200">
        <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-3">
            <p class="text-sm font-semibold text-surface-900">Tipos de producto</p>
            <app-product-type-list [types]="productTypes()" [selectedId]="selectedTypeId()" (selectType)="onSelectType($event)" />
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-surface-900">Atributos</p>
              <p-button label="Descargar CSV" icon="pi pi-download" styleClass="p-button-text p-button-sm" (onClick)="downloadTemplate()" />
            </div>
            <app-product-attributes [productType]="selectedType()" />
          </div>
        </div>
      </p-card>

      <app-product-guardrails [guardrails]="guardrails()" />

      <app-create-product-type-modal
        [visible]="isCreateOpen()"
        (closed)="closeCreateModal()"
        (submitted)="handleCreateType($event)"
      />
    </div>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductSettingsPage {
  private readonly data = inject(ProductSettingsData);

  protected readonly productTypes = this.data.productTypes;
  protected readonly guardrails = this.data.guardrails;
  protected readonly metrics = this.data.metrics;

  protected readonly selectedTypeId = signal<string>('type-electronica');
  protected readonly selectedType = computed(() => this.productTypes().find(t => t.id === this.selectedTypeId()) ?? null);

  readonly isCreateOpen = signal<boolean>(false);

  protected onSelectType(id: string) {
    this.selectedTypeId.set(id);
  }

  protected openCreateModal() {
    this.isCreateOpen.set(true);
  }

  protected closeCreateModal() {
    this.isCreateOpen.set(false);
  }

  protected handleCreateType(payload: INewProductTypeWithAttributes) {
    const created = this.data.addProductType(payload);
    this.selectedTypeId.set(created.id);
    this.closeCreateModal();
  }

  protected downloadTemplate() {
    const type = this.selectedType();
    if (!type) {
      return;
    }

    const baseColumns = ['productTypeId', 'productTypeVersion', 'sku', 'name', 'category', 'price', 'stock'];
    const dynamicColumns = type.attributes.map(attr => attr.key);
    const headers = [...baseColumns, ...dynamicColumns];

    const sampleRow = [
      type.id,
      type.version,
      'SKU-001',
      'Producto de ejemplo',
      'Categoría',
      '0',
      '0',
      ...dynamicColumns.map(() => ''),
    ];

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.id}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
