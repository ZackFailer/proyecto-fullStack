import { computed, inject, Injectable, signal } from '@angular/core';
import { IProduct } from '../../../@core/interfaces/i-product';
import { ITableColumn, ITableConfig } from '../../../shared/table/single-table';
import { ProductApi } from './product-api';
import { IInputProvs } from '../../../@core/interfaces/i-input-provs';
import { ISelectList } from '../../../@core/interfaces/i-select-list';

export interface IFilterConfig {
  inputsFilter: IInputProvs[];
  selectFilter: ISelectFilter[];
}

export interface ISelectFilter {
  key: keyof IProduct;
  name: string;
  options: ISelectList[];
  selectedValue?: string;
  placeholder?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductData {
  private readonly productApi = inject(ProductApi);

  private readonly products = signal<IProduct[]>([]);
  private readonly columns = signal<ITableColumn[]>([
    { field: 'img', header: 'Imagen' },
    { field: 'name', header: 'Nombre' },
    { field: 'category', header: 'Categoría' },
    { field: 'price', header: 'Precio' },
    { field: 'stock', header: 'Stock' },
  ]);

  private readonly filters = signal<IInputProvs[]>([
    { type: 'text', placeholder: 'Buscar por nombre' },
    { type: 'text', placeholder: 'Categoría' },
  ]);

  private readonly selectFilters = signal<ISelectFilter[]>([
    {
      key: 'category',
      name: 'Categoría',
      options: [
        { name: 'Electrónica', code: 'ELEC' },
        { name: 'Ropa', code: 'ROPA' },
        { name: 'Hogar', code: 'HOG' },
      ],
      placeholder: 'Filtrar por categoría',
    }
  ]);

  public readonly tableConfig = computed<ITableConfig<IProduct>>(() => ({
    item: this.products(),
    columns: this.columns(),
    paginator: true,
    rows: 8,
    showActions: true,
  }));

  public readonly filterConfig = computed<IFilterConfig>(() => ({
    inputsFilter: this.filters(),
    selectFilter: this.selectFilters(),
  }));

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productApi.getProducts().subscribe(data => this.products.set(data));
  }
}
