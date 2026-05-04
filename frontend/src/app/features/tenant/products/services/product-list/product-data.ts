import { computed, inject, Injectable, signal } from '@angular/core';
import { IProduct } from '../../../../../@core/interfaces/i-product';
import { ITableColumn, ITableConfig } from '../../../../../shared/table/single-table';
import { ProductApi } from './product-api';
import { IInputProvs } from '../../../../../@core/interfaces/i-input-provs';
import { ISelectList } from '../../../../../@core/interfaces/i-select-list';

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

  private readonly _products = signal<IProduct[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _searchTerm = signal('');
  private readonly _selectFilters = signal<Record<string, string | null>>({});

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly _tableColumns = signal<ITableColumn[]>([
    { field: 'img', header: 'Imagen', type: 'image' },
    { field: 'sku', header: 'SKU' },
    { field: 'name', header: 'Nombre' },
    { field: 'category', header: 'Categoría' },
    { field: 'price', header: 'Precio', type: 'currency' },
    { field: 'stock', header: 'Stock', type: 'number' },
    { field: 'status', header: 'Estado' },
  ]);

  readonly columns = this._tableColumns.asReadonly();

  private readonly filters = signal<IInputProvs[]>([
    { type: 'text', placeholder: 'Buscar por nombre o SKU', key: 'search' },
  ]);

  private readonly selectFilters = computed<ISelectFilter[]>(() => {
    const products = this._products();
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [
      {
        key: 'category',
        name: 'Categoría',
        options: categories.map(c => ({ name: c, code: c })),
        placeholder: 'Filtrar por categoría',
      },
      {
        key: 'status',
        name: 'Estado',
        options: [
          { name: 'Activo', code: 'active' },
          { name: 'Inactivo', code: 'inactive' },
        ],
        placeholder: 'Filtrar por estado',
      },
    ];
  });

  public readonly products = computed(() => {
    const products = this._products();
    const term = this._searchTerm().trim().toLowerCase();
    const selectFilters = this._selectFilters();

    let filtered = products;

    if (term) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    filtered = filtered.filter(product => {
      return Object.entries(selectFilters).every(([key, value]) => {
        if (!value) return true;
        const fieldValue = product[key as keyof IProduct];
        return typeof fieldValue === 'string' && fieldValue.toLowerCase() === value.toLowerCase();
      });
    });

    return filtered;
  });

  public readonly tableConfig = computed<ITableConfig<IProduct>>(() => ({
    item: this.products(),
    columns: this._tableColumns(),
    paginator: true,
    rows: 10,
    showActions: true,
  }));

  public readonly filterConfig = computed<IFilterConfig>(() => ({
    inputsFilter: this.filters(),
    selectFilter: this.selectFilters(),
  }));

  loadProducts(): void {
    this._loading.set(true);
    this._error.set(null);

    this.productApi.getProducts().subscribe({
      next: (data) => {
        this._products.set(data);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set('Error al cargar productos');
        this._loading.set(false);
        console.error('Error loading products:', err);
      }
    });
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  setSelectFilter(key: string, value: string | null): void {
    this._selectFilters.update(prev => ({ ...prev, [key]: value }));
  }
}