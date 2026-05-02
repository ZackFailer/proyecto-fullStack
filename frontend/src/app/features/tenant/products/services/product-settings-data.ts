import { computed, Injectable, inject, signal, effect } from '@angular/core';
import { INewProductType, INewProductTypeWithAttributes, IProductAttribute, IProductSettingsMetrics, IProductType } from '../interfaces/product-settings';
import { ProductTypeApi, CreateProductTypePayload } from './product-type-api';

@Injectable({
  providedIn: 'root'
})
export class ProductSettingsData {

  private readonly api = inject(ProductTypeApi);

  private _productTypes = signal<IProductType[]>([]);
  public readonly productTypes = this._productTypes.asReadonly();

  private _loading = signal<boolean>(false);
  public readonly loading = this._loading.asReadonly();

  private _error = signal<string | null>(null);
  public readonly error = this._error.asReadonly();

  public readonly guardrails = signal<ReadonlyArray<string>>([
    'Cada ProductType mantiene versión y atributos activos/inactivos; cambios breaking generan versión nueva.',
    'Los productos deben validar sus customAttributes contra el ProductType y version almacenada.',
    'No se elimina un atributo en uso: se marca deprecated y se reemplaza con uno nuevo.',
    'Carga masiva usa plantilla generada por ProductType vigente y debe reportar errores por fila.',
    'Atributos tipo catálogo (select/multiselect) se indexan para filtrado y performance.',
  ]);

  constructor() {
    this.loadProductTypes();
  }

  private loadProductTypes(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.getProductTypes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this._productTypes.set(response.data);
        }
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set('Error al cargar tipos de producto');
        this._loading.set(false);
        console.error('Error loading product types:', err);
      }
    });
  }

  public readonly metrics = computed<IProductSettingsMetrics>(() => {
    const types = this.productTypes();
    const flattenedAttrs: IProductAttribute[] = types.flatMap(type => type.attributes as IProductAttribute[]);
    const totalAttributes = flattenedAttrs.length;
    const deprecatedAttributes = flattenedAttrs.filter(attr => Boolean(attr.isDeprecated)).length;
    const activeTypes = types.filter(t => t.isActive).length;
    const publishedTypes = types.filter(t => t.status === 'published').length;

    return { activeTypes, totalAttributes, deprecatedAttributes, publishedTypes };
  });

  public addProductType(payload: INewProductTypeWithAttributes): void {
    const apiPayload: CreateProductTypePayload = {
      name: payload.name,
      isActive: payload.isActive,
      attributes: payload.attributes.map(attr => ({
        key: attr.key,
        label: attr.label,
        type: attr.type,
        required: attr.required,
        options: attr.options ? [...attr.options] : undefined,
      })),
    };

    this.api.createProductType(apiPayload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this._productTypes.update(prev => [response.data!, ...prev]);
        }
      },
      error: (err) => {
        console.error('Error creating product type:', err);
        this._error.set('Error al crear tipo de producto');
      }
    });
  }

  public refresh(): void {
    this.loadProductTypes();
  }
}