import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Card } from 'primeng/card';
import { TableFilter } from '../../../../shared/filter/table-filter/table-filter';
import { SingleTable, ITableConfig } from '../../../../shared/table/single-table';
import { ProductData } from '../services/product-list/product-data';
import { IProduct } from '../../../../@core/interfaces/i-product';

@Component({
  selector: 'app-product-list',
  imports: [Card, TableFilter, SingleTable],
  template: `
    <div class="grid gap-4">
        <app-table-filter
          [filterConfig]="filterConfig()"
          [searchTerm]="searchTerm()"
          [selectValues]="selectValues()"
          (search)="handleSearch($event)"
          (selectionChange)="handleSelectChange($event)"
        />

      <p-card header="Listado de productos">
        @if (loading()) {
          <div class="flex justify-center p-4">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
          </div>
        } @else if (error()) {
          <div class="text-red-600 p-4">{{ error() }}</div>
        } @else {
          <app-single-table
            [tableConfig]="tableConfig()"
            (onRowSelect)="viewProduct($event)"
          />
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
export default class ProductList {
  private readonly productData = inject(ProductData);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.productData.loadProducts();
  }

  protected readonly loading = this.productData.loading;
  protected readonly error = this.productData.error;
  protected readonly searchTerm = signal('');
  protected readonly selectValues = signal<Record<string, string | null>>({});

  protected readonly filterConfig = this.productData.filterConfig;

  protected readonly tableConfig = computed<ITableConfig<IProduct>>(() => ({
    item: this.productData.products(),
    columns: this.productData.columns(),
    paginator: true,
    rows: 10,
    showActions: true,
  }));

  handleSearch(value: string) {
    this.searchTerm.set(value);
    this.productData.setSearchTerm(value);
  }

  handleSelectChange(change: { key: string; value: string | null }) {
    this.selectValues.update(prev => ({ ...prev, [change.key]: change.value }));
    this.productData.setSelectFilter(change.key, change.value);
  }

  viewProduct(product: IProduct): void {
    if (product?.sku) {
      this.router.navigate([product.sku], { relativeTo: this.route });
    }
  }
}
