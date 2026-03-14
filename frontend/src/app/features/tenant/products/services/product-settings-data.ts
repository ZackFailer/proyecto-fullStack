import { computed, Injectable, signal } from '@angular/core';
import { INewProductType, INewProductTypeWithAttributes, IProductAttribute, IProductSettingsMetrics, IProductType } from '../interfaces/product-settings';

@Injectable({
  providedIn: 'root'
})
export class ProductSettingsData {

  public readonly productTypes = signal<IProductType[]>([
    {
      id: 'type-electronica',
      name: 'Electrónica',
      version: 2,
      isActive: true,
      status: 'published',
      lastPublishedAt: '2025-12-12',
      attributes: [
        this.attribute('sku', 'SKU', 'text', true, 1, 2),
        this.attribute('marca', 'Marca', 'text', true, 2, 2),
        this.attribute('modelo', 'Modelo', 'text', true, 3, 2),
        this.attribute('color', 'Color', 'select', false, 4, 2, ['Negro', 'Blanco', 'Rojo']),
        this.attribute('garantia', 'Garantía (meses)', 'number', false, 5, 2, undefined, false),
        this.attribute('fechaLanzamiento', 'Fecha de lanzamiento', 'date', false, 6, 1, undefined, false, true),
      ],
    },
    {
      id: 'type-fashion',
      name: 'Moda y Apparel',
      version: 1,
      isActive: true,
      status: 'draft',
      lastPublishedAt: '2025-12-01',
      attributes: [
        this.attribute('sku', 'SKU', 'text', true, 1, 1),
        this.attribute('talla', 'Talla', 'select', true, 2, 1, ['XS', 'S', 'M', 'L', 'XL']),
        this.attribute('material', 'Material', 'text', false, 3, 1),
        this.attribute('color', 'Color', 'select', false, 4, 1, ['Negro', 'Blanco', 'Azul']),
        this.attribute('instruccionesCuidado', 'Instrucciones de cuidado', 'text', false, 5, 1),
        this.attribute('genero', 'Género', 'select', false, 6, 1, ['Unisex', 'Hombre', 'Mujer']),
      ],
    },
  ]);

  public readonly guardrails = signal<ReadonlyArray<string>>([
    'Cada ProductType mantiene versión y atributos activos/inactivos; cambios breaking generan versión nueva.',
    'Los productos deben validar sus customAttributes contra el ProductType y version almacenada.',
    'No se elimina un atributo en uso: se marca deprecated y se reemplaza con uno nuevo.',
    'Carga masiva usa plantilla generada por ProductType vigente y debe reportar errores por fila.',
    'Atributos tipo catálogo (select/multiselect) se indexan para filtrado y performance.',
  ]);

  public readonly metrics = computed<IProductSettingsMetrics>(() => {
    const types = this.productTypes();
    const flattenedAttrs: IProductAttribute[] = types.flatMap(type => type.attributes);
    const totalAttributes = flattenedAttrs.length;
    const deprecatedAttributes = flattenedAttrs.filter(attr => Boolean(attr.isDeprecated)).length;
    const activeTypes = types.filter(t => t.isActive).length;
    const publishedTypes = types.filter(t => t.status === 'published').length;

    return { activeTypes, totalAttributes, deprecatedAttributes, publishedTypes };
  });

  public addProductType(payload: INewProductTypeWithAttributes): IProductType {
    const id = this.slugify(payload.name) + '-' + crypto.randomUUID().slice(0, 6);
    const newType: IProductType = {
      id,
      name: payload.name,
      version: 1,
      isActive: payload.isActive,
      status: 'draft',
      lastPublishedAt: '—',
      attributes: payload.attributes.map((attr, index) => this.attribute(
        attr.key,
        attr.label,
        attr.type,
        attr.required,
        index + 1,
        1,
        attr.options,
        true,
        false,
      )),
    };

    this.productTypes.update(prev => [newType, ...prev]);
    return newType;
  }

  private attribute(
    key: string,
    label: string,
    type: IProductAttribute['type'],
    required: boolean,
    order: number,
    version: number,
    options?: ReadonlyArray<string>,
    isActive: boolean = true,
    isDeprecated: boolean = false,
    defaultValue?: string | number | boolean | null,
  ): IProductAttribute {
    return {
      key,
      label,
      type,
      required,
      options,
      order,
      version,
      isActive,
      isDeprecated,
      defaultValue,
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
