import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InventoryListData, IInventoryProduct } from '../../services/inventory-list-data';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule, FormsModule],
  template: `
    <div class="grid gap-4">
      <p-card header="Inventario - Stock de Productos">
        <div class="mb-4 flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="searchTerm"
                (input)="onSearch()"
                placeholder="Buscar por SKU, nombre o EAN..."
                class="w-full"
              />
            </span>
          </div>
          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            (onChange)="onFilterChange()"
            placeholder="Todos los estados"
            [showClear]="true"
            styleClass="w-48"
          />
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl"></i>
          </div>
        } @else if (error()) {
          <div class="text-red-600 p-4">{{ error() }}</div>
        } @else {
          <p-table 
            [value]="products()" 
            [paginator]="true" 
            [rows]="15" 
            [rowsPerPageOptions]="[10, 15, 25, 50]"
            responsiveLayout="scroll"
            [globalFilterFields]="['sku', 'name', 'ean']"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="sku">SKU <p-sortIcon field="sku" /></th>
                <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                <th pSortableColumn="productTypeId">Tipo <p-sortIcon field="productTypeId" /></th>
                <th>EAN</th>
                <th pSortableColumn="stock" class="text-center">Stock <p-sortIcon field="stock" /></th>
                <th pSortableColumn="price" class="text-right">Precio <p-sortIcon field="price" /></th>
                <th>Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-product>
              <tr>
                <td>
                  <span class="font-mono text-sm">{{ product.sku || '-' }}</span>
                </td>
                <td>
                  <div class="font-semibold">{{ product.name }}</div>
                  @if (product.category) {
                    <div class="text-xs text-surface-500">{{ product.category }}</div>
                  }
                </td>
                <td>
                  <span class="rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-700">
                    {{ product.productTypeId || '-' }}
                  </span>
                </td>
                <td>
                  <span class="font-mono text-sm text-surface-600">{{ product.ean || '-' }}</span>
                </td>
                <td class="text-center">
                  <span 
                    class="inline-block min-w-[60px] rounded-full px-3 py-1 text-center font-bold"
                    [class]="getStockClass(product.stock)"
                  >
                    {{ product.stock ?? 0 }}
                  </span>
                </td>
                <td class="text-right">
                  @if (product.price != null) {
                    <span class="font-semibold">\${{ product.price | number:'1.2-2' }}</span>
                  } @else {
                    <span class="text-surface-400">-</span>
                  }
                </td>
                <td>
                  <p-tag 
                    [value]="product.status === 'active' ? 'Activo' : 'Inactivo'" 
                    [severity]="product.status === 'active' ? 'success' : 'danger'" 
                  />
                </td>
                <td class="text-center">
                  <p-button 
                    icon="pi pi-eye" 
                    [text]="true" 
                    severity="secondary"
                    (onClick)="viewProduct(product)"
                    pTooltip="Ver detalle"
                    tooltipPosition="top"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="8" class="text-center py-8 text-surface-500">
                  <i class="pi pi-inbox text-4xl mb-4 block"></i>
                  No se encontraron productos en el inventario
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InventoryListPage {
  private readonly data = inject(InventoryListData);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = this.data.loading;
  protected readonly error = this.data.error;
  protected readonly products = this.data.products;

  protected searchTerm = '';
  protected selectedStatus: string | null = null;

  protected readonly statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' }
  ];

  constructor() {
    this.data.loadProducts();
  }

  onSearch(): void {
    this.data.loadProducts(this.searchTerm, { status: this.selectedStatus });
  }

  onFilterChange(): void {
    this.data.loadProducts(this.searchTerm, { status: this.selectedStatus });
  }

  viewProduct(product: IInventoryProduct): void {
    if (product?.sku) {
      this.router.navigate([product.sku], { relativeTo: this.route });
    }
  }

  getStockClass(stock: number | null | undefined): string {
    if (stock == null || stock <= 0) {
      return 'bg-red-100 text-red-700';
    }
    if (stock <= 10) {
      return 'bg-amber-100 text-amber-700';
    }
    return 'bg-green-100 text-green-700';
  }
}
