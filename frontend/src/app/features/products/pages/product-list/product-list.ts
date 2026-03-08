import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { TableFilter } from '../../../../shared/filter/table-filter/table-filter';
import { SingleTable } from '../../../../shared/table/single-table';
import { ProductData } from '../../services/product-data';

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
        <app-single-table [tableConfig]="filteredTableConfig()" />
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
  protected readonly searchTerm = signal('');
  protected readonly selectValues = signal<Record<string, string | null>>({});

  protected readonly filterConfig = this.productData.filterConfig;
  protected readonly filteredTableConfig = computed(() => {
    const config = this.productData.tableConfig();
    const term = this.searchTerm().trim().toLowerCase();
    const selectFilters = this.selectValues();
    const filteredItems = term
      ? config.item.filter(p =>
          p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
        )
      : config.item;

    const withSelectFilters = filteredItems.filter(product => {
      return Object.entries(selectFilters).every(([key, value]) => {
        if (!value) return true;
        const fieldValue = product[key as keyof typeof product];
        return typeof fieldValue === 'string' && fieldValue.toLowerCase() === value.toLowerCase();
      });
    });

    return { ...config, item: withSelectFilters };
  });

  handleSearch(value: string) {
    this.searchTerm.set(value);
  }

  handleSelectChange(change: { key: string; value: string | null }) {
    this.selectValues.update(prev => ({ ...prev, [change.key]: change.value }));
  }
}
