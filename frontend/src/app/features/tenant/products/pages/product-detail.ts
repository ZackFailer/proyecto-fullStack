import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Select } from 'primeng/select';
import { ProductDetailData } from '../../inventory/services/product-detail-data';
import { TransferModal } from '../../inventory/components/transfer-modal/transfer-modal';
import { Auth, AuthUser } from '../../../../@core/services/auth/auth';
import { IRelatedProductEntry, IProduct } from '../../../../@core/interfaces/i-product';
import { ProductTypeApi, IProductType } from '../../products/services/product-type-api';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Card,
    Tag,
    DecimalPipe,
    Select,
    TransferModal,
  ],
  template: `
    <div class="grid gap-4">
      @if (loading()) {
        <p-card styleClass="shadow-1 border border-surface-200">
          <div class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl"></i>
          </div>
        </p-card>
      } @else if (error()) {
        <p-card styleClass="shadow-1 border border-surface-200">
          <div class="flex flex-col items-center gap-4 py-8">
            <span class="text-red-600 text-lg">{{ error() }}</span>
            <p-button label="Volver" (onClick)="goBack()" />
          </div>
        </p-card>
      } @else if (product()) {
        <p-card styleClass="shadow-1 border border-surface-200">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-col gap-3">
              <p-button icon="pi pi-arrow-left" label="Volver al listado" [text]="true" (onClick)="goBack()" />

              <div class="flex flex-wrap items-center gap-2">
                <h1 class="m-0 text-2xl font-bold">{{ product()!.name }}</h1>
                <p-tag [value]="product()!.status === 'active' ? 'Activo' : 'Inactivo'" [severity]="product()!.status === 'active' ? 'success' : 'danger'" />
              </div>

              <div class="flex flex-wrap items-center gap-2 text-sm text-surface-600">
                <span class="rounded-full border border-surface-300 px-2 py-1 font-mono">SKU {{ product()!.sku }}</span>
                <span class="rounded-full border border-surface-300 px-2 py-1">Categoría {{ product()!.category }}</span>
              </div>

              @if (product()!.description) {
                <p class="m-0 max-w-4xl text-sm text-surface-700">{{ product()!.description }}</p>
              }
            </div>

            <div class="flex flex-wrap items-center gap-2">
              @if (canTransfer()) {
                <p-button
                  label="Transferir inventario"
                  icon="pi pi-arrow-right-arrow-left"
                  (onClick)="openTransferModal()"
                />
              }
            </div>
          </div>
        </p-card>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">SKU</div>
            <div class="text-xl font-mono">{{ product()!.sku || '-' }}</div>
          </p-card>

          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">EAN</div>
            <div class="text-xl font-mono">{{ product()!.ean || 'Sin EAN' }}</div>
          </p-card>

          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">Precio unitario</div>
            <div class="text-xl">\${{ product()!.price | number:'1.2-2' }}</div>
          </p-card>

          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">Stock disponible</div>
            <div class="text-xl" [class]="product()!.stock > 0 ? 'text-green-600' : 'text-red-600'">
              {{ product()!.stock }}
            </div>
          </p-card>

          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">Categoría</div>
            <div class="text-xl">{{ product()!.category }}</div>
          </p-card>

          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-2 text-sm font-semibold text-surface-700">Última actualización</div>
            <div class="text-xl">{{ product()!.updatedAt ? (product()!.updatedAt | date:'medium') : '-' }}</div>
          </p-card>
        </div>

        <p-card styleClass="shadow-1 border border-surface-200">
          <div class="mb-3 text-base font-semibold">Atributos dinámicos</div>

          @if (dynamicAttributes().length > 0) {
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              @for (attribute of dynamicAttributes(); track attribute.key) {
                <div class="rounded-md border border-surface-200 p-3">
                  <div class="text-xs uppercase tracking-wide text-surface-500">{{ attribute.label }}</div>
                  <div class="mt-1 text-sm text-surface-900">{{ attribute.value }}</div>
                </div>
              }
            </div>
          } @else {
            <div class="rounded-md border border-dashed border-surface-300 p-4 text-sm text-surface-500">
              Este producto no tiene atributos dinámicos configurados.
            </div>
          }
        </p-card>

@if (canViewRelated()) {
          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-3 flex items-center justify-between">
              <span class="font-semibold">Productos relacionados</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-surface-500">{{ relatedProducts().length }} vinculados</span>
                @if (canEditRelated()) {
                  @if (isEditingRelations()) {
                    <p-button label="Cancelar" styleClass="p-button-text p-button-sm" (onClick)="cancelEditRelations()" />
                    <p-button label="Guardar" styleClass="p-button-success p-button-sm" [loading]="savingRelations()" (onClick)="saveRelations()" />
                  } @else {
                    <p-button label="Editar relaciones" icon="pi pi-pencil" styleClass="p-button-text p-button-sm" (onClick)="startEditRelations()" />
                  }
                }
              </div>
            </div>

            @if (isEditingRelations()) {
              <!-- Edit mode -->
              <div class="space-y-3">
                @for (relation of editingRelations(); track $index; let i = $index) {
                  <div class="flex items-center gap-2 rounded-md border border-surface-300 p-3">
                    <p-select
                      [options]="availableProducts()"
                      [(ngModel)]="relation.sku"
                      optionLabel="displayLabel"
                      optionValue="sku"
                      placeholder="Seleccionar SKU"
                      [filter]="true"
                      filterBy="displayLabel"
                      styleClass="flex-1"
                    >
                      <ng-template let-product pTemplate="item">
                        <div class="flex flex-col">
                          <span class="font-mono text-sm">{{ product.sku }}</span>
                          <span class="text-xs text-surface-500">{{ product.name }}</span>
                          @if (product.conversionText) {
                            <span class="text-xs text-primary">{{ product.conversionText }}</span>
                          }
                        </div>
                      </ng-template>
                    </p-select>

                    <p-select
                      [options]="relationTypes"
                      [(ngModel)]="relation.type"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      styleClass="w-40"
                    />

                    <p-button icon="pi pi-trash" styleClass="p-button-text p-button-danger" (onClick)="removeRelation(i)" />
                  </div>
                }

                <p-button label="Agregar relación" icon="pi pi-plus" styleClass="p-button-outlined p-button-sm" (onClick)="addRelation()" [disabled]="savingRelations()" />
              </div>
            } @else {
              <div class="flex flex-col gap-2">
                @for (item of relatedProducts(); track item.sku) {
                  <div class="grid items-center gap-2 rounded-md border border-surface-200 p-3 md:grid-cols-[1.3fr_1fr_90px_auto]">
                    <div>
                      <div class="font-mono text-sm">{{ item.sku }}</div>
                      <div class="text-sm text-surface-700">{{ item.name }}</div>
                    </div>

                    <div>
                      <span class="rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-700">{{ relationLabel(item.type) }}</span>
                    </div>

                    <div [class]="item.stock > 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'">
                      {{ item.stock }}
                    </div>

                    <div class="flex justify-end">
                      <p-button icon="pi pi-eye" label="Ver detalle" [text]="true" (onClick)="viewProduct(item.sku)" />
                    </div>
                  </div>
                }
              </div>
            }
          </p-card>
        } @else {
          <p-card styleClass="shadow-1 border border-surface-200">
            <div class="mb-3 text-base font-semibold">Productos relacionados</div>
            <div class="rounded-md border border-dashed border-surface-300 p-4 text-sm text-surface-500">
              Tu rol actual no tiene acceso a la visualización de relaciones entre productos.
            </div>
          </p-card>
        }

        <p-card styleClass="shadow-1 border border-surface-200">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-semibold">Timeline de movimientos</span>
            <span class="text-xs text-surface-500">{{ timeline().length }} eventos</span>
          </div>

          @if (timeline().length === 0) {
            <div class="rounded-md border border-dashed border-surface-300 p-4 text-sm text-surface-500">
              Sin movimientos registrados para este producto.
            </div>
          } @else {
            <div class="flex flex-col gap-2">
              @for (event of timeline(); track event.id) {
                <div class="rounded-md border border-surface-200 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-700">{{ event.type }}</span>
                      <span class="text-sm font-semibold">{{ event.action }}</span>
                    </div>
                    <span class="text-xs text-surface-500">{{ event.createdAt | date:'medium' }}</span>
                  </div>

                  <pre class="mt-2 overflow-x-auto rounded bg-surface-50 p-2 text-xs text-surface-700">{{ event.payload | json }}</pre>
                </div>
              }
            </div>
          }
        </p-card>
      }

      <app-transfer-modal
        #transferModal
        [products]="products()"
        [candidateProducts]="relatedProducts().map(r => ({ sku: r.sku, name: r.name }))"
        [currentSKU]="product()?.sku ?? ''"
        [currentStock]="product()?.stock ?? 0"
        (refreshNeeded)="refreshProduct()"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(ProductDetailData);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = this.data.loading;
  readonly error = this.data.error;
  readonly product = this.data.product;
  readonly products = this.data.products;
  readonly relatedProducts = this.data.relatedProducts;
  readonly timeline = this.data.timeline;
  readonly transferModal = viewChild<TransferModal>('transferModal');

  // Relationship editing state
  private readonly _isEditingRelations = signal(false);
  private readonly _editingRelations = signal<IRelatedProductEntry[]>([]);
  private readonly _savingRelations = signal(false);
  private readonly _availableProducts = signal<{ sku: string; name: string; displayLabel: string; conversionText: string }[]>([]);

  private readonly productTypeApi = inject(ProductTypeApi);
  private readonly _productTypes = signal<IProductType[]>([]);

  readonly isEditingRelations = this._isEditingRelations.asReadonly();
  readonly editingRelations = this._editingRelations.asReadonly();
  readonly savingRelations = this._savingRelations.asReadonly();
  readonly availableProducts = this._availableProducts.asReadonly();

  private readonly computeProductDisplay = (product: IProduct): { sku: string; name: string; displayLabel: string; conversionText: string } => {
    const sku = product.sku ?? '';
    const name = product.name ?? '';
    const displayLabel = `${sku} - ${name}`;
    const conversionText = '';

    if (!product.productTypeId) {
      return { sku, name, displayLabel, conversionText };
    }

    const productTypes = this._productTypes();
    const productType = productTypes.find(t => t.id === product.productTypeId);
    if (!productType?.conversionAttribute || !product.customAttributes) {
      return { sku, name, displayLabel, conversionText };
    }

    const attrKey = productType.conversionAttribute;
    const attrDef = productType.attributes.find(a => a.key === attrKey);
    const attrValue = product.customAttributes[attrKey];

    if (attrDef && attrValue !== undefined && typeof attrValue === 'number') {
      const label = attrDef.label;
      const fullLabel = `${sku} - ${name} (${label}: ${attrValue})`;
      return { sku, name, displayLabel: fullLabel, conversionText: `${label}: ${attrValue}` };
    }

    return { sku, name, displayLabel, conversionText };
  };

  readonly relationTypes = [
    { label: 'Derivado de', value: 'derived-from' },
    { label: 'Componente de', value: 'component-of' },
    { label: 'Variante de', value: 'variant-of' },
    { label: 'Relacionado', value: 'related' },
  ];

  readonly role = computed<AuthUser['role']>(() => this.auth.currentUser()?.role ?? 'viewer');
  readonly canTransfer = computed(() => {
    const currentRole = this.role();
    return currentRole === 'admin' || currentRole === 'super-admin';
  });
  readonly canViewRelated = computed(() => {
    const currentRole = this.role();
    return currentRole === 'admin' || currentRole === 'operator' || currentRole === 'super-admin';
  });
  readonly canEditRelated = computed(() => {
    const currentRole = this.role();
    return currentRole === 'admin' || currentRole === 'super-admin';
  });

  constructor() {
    // Effect to load product types and build enriched options when entering edit mode
    effect(() => {
      if (this._isEditingRelations()) {
        // Load product types for conversion attribute metadata
        this.productTypeApi.getProductTypes().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this._productTypes.set(response.data);
            }
          },
          error: () => {
            this._productTypes.set([]);
          },
          complete: () => {},
        });

        const products = this.data.products();
        const currentSku = this.product()?.sku;
        if (products.length > 0) {
          const filteredProducts = products
            .filter((p: IProduct) => p.sku !== currentSku)
            .map((p: IProduct) => this.computeProductDisplay(p));
          this._availableProducts.set(filteredProducts);
        }
      }
    });
  }

  readonly dynamicAttributes = computed(() => {
    const attributes = this.product()?.customAttributes;
    if (!attributes || typeof attributes !== 'object') {
      return [];
    }

    return Object.entries(attributes).map(([key, value]) => ({
      key,
      label: this.formatAttributeLabel(key),
      value: this.formatAttributeValue(value),
    }));
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('sku') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (sku) => {
          if (!sku) {
            return;
          }

          this.data.loadProduct(sku, this.canViewRelated());
        },
        error: () => {},
        complete: () => {},
      });
  }

  relationLabel(type: string): string {
    const labels: Record<string, string> = {
      'derived-from': 'Derivado de',
      'component-of': 'Componente de',
      'variant-of': 'Variante de',
      related: 'Relacionado',
    };

    return labels[type] ?? 'Relacionado';
  }

  private formatAttributeLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (value) => value.toUpperCase());
  }

  private formatAttributeValue(rawValue: unknown): string {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return 'Sin valor';
    }

    if (Array.isArray(rawValue)) {
      return rawValue.map((item) => this.formatAttributeValue(item)).join(', ');
    }

    if (typeof rawValue === 'boolean') {
      return rawValue ? 'Sí' : 'No';
    }

    if (typeof rawValue === 'number' || typeof rawValue === 'string') {
      return String(rawValue);
    }

    if (typeof rawValue === 'object') {
      const objectValue = rawValue as Record<string, unknown>;
      const summary = Object.entries(objectValue)
        .map(([key, value]) => `${this.formatAttributeLabel(key)}: ${this.formatAttributeValue(value)}`)
        .join(' | ');

      return summary || 'Objeto vacío';
    }

    return String(rawValue);
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  openTransferModal(): void {
    if (!this.canTransfer()) {
      return;
    }

    const modal = this.transferModal();
    if (modal && this.product()?.sku) {
      modal.open();
    }
  }

  viewProduct(sku: string): void {
    this.router.navigate(['..', sku], { relativeTo: this.route });
  }

  refreshProduct(): void {
    const sku = this.product()?.sku;
    if (sku) {
      this.data.loadProduct(sku, this.canViewRelated());
    }
  }

  startEditRelations(): void {
    // Lazy-load products only when entering edit mode
    this.data.loadProducts();

    // Initialize editing relations from current product's relatedProducts
    const currentRelations = this.product()?.relatedProducts || [];
    this._editingRelations.set([...currentRelations]);

    // If empty, add one empty row
    if (this._editingRelations().length === 0) {
      this._editingRelations.set([{ sku: '', type: 'related' }]);
    }

    this._isEditingRelations.set(true);

    // Use effect to react to products signal changes
    // This runs when products signal updates after loadProducts() completes
  }

  cancelEditRelations(): void {
    this._isEditingRelations.set(false);
    this._editingRelations.set([]);
  }

  addRelation(): void {
    const current = this._editingRelations();
    this._editingRelations.set([...current, { sku: '', type: 'related' }]);
  }

  removeRelation(index: number): void {
    const current = this._editingRelations();
    const updated = [...current];
    updated.splice(index, 1);
    this._editingRelations.set(updated);
  }

  async saveRelations(): Promise<void> {
    // Filter out empty SKUs
    const validRelations = this._editingRelations()
      .filter(r => r.sku && r.type)
      .map(r => ({ sku: r.sku, type: r.type as IRelatedProductEntry['type'] }));

    if (validRelations.length === 0) {
      // If no valid relations, save empty array to clear all
      this._savingRelations.set(true);
      try {
        await this.data.saveRelatedProducts([]);
        this._isEditingRelations.set(false);
        this._editingRelations.set([]);
      } catch {
        // Error handled in service
      } finally {
        this._savingRelations.set(false);
      }
      return;
    }

    this._savingRelations.set(true);
    try {
      await this.data.saveRelatedProducts(validRelations);
      this._isEditingRelations.set(false);
      this._editingRelations.set([]);
    } catch {
      // Error handled in service
    } finally {
      this._savingRelations.set(false);
    }
  }
}

export default ProductDetail;
