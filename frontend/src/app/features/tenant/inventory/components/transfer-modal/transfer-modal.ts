import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, pairwise } from 'rxjs';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { IProduct } from '../../../../../@core/interfaces/i-product';
import { ProductDetailData } from '../../services/product-detail-data';
import { ITransferPreview } from '../../services/inventory-api';

@Component({
  selector: 'app-transfer-modal',
  imports: [
    Dialog,
    Button,
    ReactiveFormsModule,
    InputNumber,
    Textarea,
    Select,
  ],
  template: `
    <p-dialog
      header="Transferir Inventario"
      [modal]="true"
      [visible]="visible()"
      [style]="{ width: '450px' }"
      (onVisibleChange)="onClose()"
      [draggable]="false"
      [resizable]="false"
    >
      <form [formGroup]="transferForm" class="flex flex-col gap-4">
        <div class="rounded-md border border-surface-200 bg-surface-50 p-3 text-sm">
          <div class="font-semibold">Origen</div>
          <div class="mt-1 font-mono">{{ currentSKU() || '-' }}</div>
          <div class="text-surface-600">Stock disponible: {{ currentStock() }}</div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="toSKU" class="font-semibold">SKU Destino *</label>
          <p-select
            id="toSKU"
            formControlName="toSKU"
            [options]="skuOptions()"
            optionLabel="label"
            optionValue="sku"
            placeholder="Seleccionar SKU destino"
            [filter]="true"
            filterPlaceholder="Buscar SKU..."
            [showClear]="true"
            styleClass="w-full"
          />
          @if (transferForm.get('toSKU')?.invalid && transferForm.get('toSKU')?.touched) {
            <small class="text-red-600">Seleccione un SKU destino</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="quantity" class="font-semibold">Cantidad *</label>
          <p-inputNumber
            id="quantity"
            formControlName="quantity"
            [min]="1"
            [max]="currentStock()"
            placeholder="Cantidad a transferir"
            styleClass="w-full"
          />
          @if (transferForm.get('quantity')?.invalid && transferForm.get('quantity')?.touched) {
            <small class="text-red-600">Ingrese una cantidad válida (máx: {{ currentStock() }})</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="reason" class="font-semibold">Motivo (opcional)</label>
          <textarea
            pTextarea
            id="reason"
            formControlName="reason"
            rows="3"
            placeholder="Motivo de la transferencia"
            class="w-full"
          ></textarea>
        </div>

        @if (preview()) {
          <div class="rounded-md border border-surface-200 p-3 text-sm">
            <div class="font-semibold mb-1">Vista previa de transferencia</div>
            <div>Origen: <span class="font-mono">{{ preview()!.quantityFrom }}</span></div>
            <div>Destino: <span class="font-mono">{{ preview()!.quantityTo }}</span></div>
            <div>Tipo: {{ preview()!.conversionApplied ? 'Con conversión' : '1 a 1' }}</div>

            @if (preview()!.conversionPreview) {
              <div class="mt-2 text-surface-700">
                Fórmula: ({{ preview()!.quantityFrom }} * {{ preview()!.conversionPreview!.fromValue }}) / {{ preview()!.conversionPreview!.toValue }} = {{ preview()!.quantityTo }}
              </div>
              <div class="text-surface-600">
                Atributos: {{ preview()!.conversionPreview!.fromAttribute }} -> {{ preview()!.conversionPreview!.toAttribute }}
              </div>
            }
          </div>
        }
      </form>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancelar"
            severity="secondary"
            [outlined]="true"
            (onClick)="onClose()"
            [disabled]="transferring()"
          />
          <p-button
            label="Transferir"
            icon="pi pi-arrow-right"
            (onClick)="onSubmit()"
            [disabled]="transferForm.invalid || transferring() || previewLoading()"
            [loading]="transferring()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferModal {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(ProductDetailData);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);
  readonly transferring = signal(false);
  readonly previewLoading = signal(false);
  readonly preview = signal<ITransferPreview | null>(null);
  readonly refreshNeeded = output<void>();

  readonly products = input<IProduct[]>([]);
  readonly currentSKU = input<string>('');
  readonly currentStock = input<number>(0);

  readonly skuOptions = signal<{ sku: string; label: string }[]>([]);

  readonly transferForm = this.fb.group({
    toSKU: ['', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    reason: [''],
  });

  constructor() {
    this.transferForm.valueChanges
      .pipe(
        debounceTime(200),
        pairwise(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ([prev, curr]) => {
          if (this.visible()) {
            const changedKeyFields = prev.toSKU !== curr.toSKU || prev.quantity !== curr.quantity;
            if (changedKeyFields) {
              void this.loadPreview();
            }
          }
        },
        error: () => {},
        complete: () => {},
      });
  }

  open(): void {
    const list = this.products();
    const sku = this.currentSKU();

    const options = list
      .filter(p => p.sku !== sku)
      .map(p => ({ sku: p.sku || '', label: `${p.sku || ''} - ${p.name || ''}` }));

    this.skuOptions.set(options);
    this.transferForm.reset();
    this.transferForm.patchValue({ quantity: null, reason: '' });
    this.preview.set(null);
    this.data.clearPreview();
    this.visible.set(true);
  }

  onClose(): void {
    this.visible.set(false);
    this.transferForm.reset();
    this.preview.set(null);
    this.data.clearPreview();
  }

  async loadPreview(): Promise<void> {
    const { toSKU, quantity, reason } = this.transferForm.value;
    if (!toSKU || !quantity || this.transferForm.invalid) {
      this.preview.set(null);
      return;
    }

    this.previewLoading.set(true);

    try {
      const result = await this.data.previewTransfer({
        fromSKU: this.currentSKU(),
        toSKU,
        quantity,
        reason: reason || undefined,
      });
      this.preview.set(result);
    } catch {
      this.preview.set(null);
    } finally {
      this.previewLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const { toSKU, quantity, reason } = this.transferForm.value;
    if (!toSKU || !quantity) return;

    await this.loadPreview();

    this.transferring.set(true);

    try {
      await this.data.transferInventory({
        fromSKU: this.currentSKU(),
        toSKU,
        quantity,
        reason: reason || undefined,
      });

      this.onClose();
      this.refreshNeeded.emit();
    } catch {
      // Error handled in service
    } finally {
      this.transferring.set(false);
    }
  }
}
