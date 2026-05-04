import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { ProductDetailData } from '../../inventory/services/product-detail-data';
import { TransferModal } from '../../inventory/components/transfer-modal/transfer-modal';
import { Auth, AuthUser } from '../../../../@core/services/auth/auth';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    Button,
    Card,
    Tag,
    DecimalPipe,
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
              <span class="text-xs text-surface-500">{{ relatedProducts().length }} vinculados</span>
            </div>

            @if (relatedProducts().length === 0) {
              <div class="rounded-md border border-dashed border-surface-300 p-4 text-sm text-surface-500">
                Este producto no tiene SKU relacionados.
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
      }

      <app-transfer-modal
        #transferModal
        [products]="products()"
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

  constructor() {
    this.data.loadProducts();
  }

  readonly loading = this.data.loading;
  readonly error = this.data.error;
  readonly product = this.data.product;
  readonly products = this.data.products;
  readonly relatedProducts = this.data.relatedProducts;
  readonly transferModal = viewChild<TransferModal>('transferModal');

  readonly role = computed<AuthUser['role']>(() => this.auth.currentUser()?.role ?? 'viewer');
  readonly canTransfer = computed(() => {
    const currentRole = this.role();
    return currentRole === 'admin' || currentRole === 'super-admin';
  });
  readonly canViewRelated = computed(() => {
    const currentRole = this.role();
    return currentRole === 'admin' || currentRole === 'operator' || currentRole === 'super-admin';
  });

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

          if (this.canTransfer()) {
            this.data.loadProducts();
          }
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

      if (this.canTransfer()) {
        this.data.loadProducts();
      }
    }
  }
}

export default ProductDetail;
