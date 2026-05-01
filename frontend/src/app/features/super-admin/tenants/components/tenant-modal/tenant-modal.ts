import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ISelectList } from '../../../../../@core/interfaces/i-select-list';
import { TenantFormValue, TenantListItemDTO, TenantStatus } from '../../interfaces/tenant';

@Component({
  selector: 'app-tenant-modal',
  imports: [DialogModule, FormsModule, InputTextModule, SelectModule, ButtonModule],
  template: `
    <p-dialog
      [header]="title()"
      [visible]="visible()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(95vw, 42rem)' }"
      (visibleChange)="onVisibleChange($event)"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-slug">Slug</label>
          <input id="tenant-slug" pInputText [ngModel]="form().slug" (ngModelChange)="update('slug', $event)" [disabled]="isEdit()" />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-name">Nombre</label>
          <input id="tenant-name" pInputText [ngModel]="form().name" (ngModelChange)="update('name', $event)" />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-legal-name">Razon social</label>
          <input id="tenant-legal-name" pInputText [ngModel]="form().legalName" (ngModelChange)="update('legalName', $event)" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-document-type">Tipo documento</label>
          <input id="tenant-document-type" pInputText [ngModel]="form().documentType" (ngModelChange)="update('documentType', $event)" [disabled]="isEdit()" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-document">Documento</label>
          <input id="tenant-document" pInputText [ngModel]="form().documentNumber" (ngModelChange)="update('documentNumber', $event)" [disabled]="isEdit()" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-status">Estado</label>
          <p-select
            inputId="tenant-status"
            [options]="statusOptions()"
            optionLabel="name"
            optionValue="code"
            appendTo="body"
            [ngModel]="form().status"
            (ngModelChange)="update('status', $event)"
          />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-email">Email</label>
          <input id="tenant-email" pInputText [ngModel]="form().email" (ngModelChange)="update('email', $event)" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-phone">Telefono</label>
          <input id="tenant-phone" pInputText [ngModel]="form().phone" (ngModelChange)="update('phone', $event)" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-currency">Moneda</label>
          <input id="tenant-currency" pInputText [ngModel]="form().currency" (ngModelChange)="update('currency', $event)" placeholder="USD" />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-timezone">Zona horaria</label>
          <input id="tenant-timezone" pInputText [ngModel]="form().timezone" (ngModelChange)="update('timezone', $event)" placeholder="UTC" />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-address">Direccion</label>
          <input id="tenant-address" pInputText [ngModel]="form().address" (ngModelChange)="update('address', $event)" />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <label for="tenant-logo-url">Logo URL</label>
          <input id="tenant-logo-url" pInputText [ngModel]="form().brandingLogoUrl" (ngModelChange)="update('brandingLogoUrl', $event)" />
        </div>

        <div class="grid gap-2">
          <label for="tenant-primary-color">Color primario</label>
          <div class="flex gap-2 items-center">
            <input
              type="color"
              id="tenant-primary-color"
              class="h-10 w-12 cursor-pointer border-0 p-0"
              [ngModel]="form().brandingPrimaryColor"
              (ngModelChange)="update('brandingPrimaryColor', $event)"
            />
            <input
              id="tenant-primary-color-text"
              class="flex-1"
              pInputText
              [ngModel]="form().brandingPrimaryColor"
              (ngModelChange)="update('brandingPrimaryColor', $event)"
              placeholder="#0ea5e9"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <label for="tenant-secondary-color">Color secundario</label>
          <div class="flex gap-2 items-center">
            <input
              type="color"
              id="tenant-secondary-color"
              class="h-10 w-12 cursor-pointer border-0 p-0"
              [ngModel]="form().brandingSecondaryColor"
              (ngModelChange)="update('brandingSecondaryColor', $event)"
            />
            <input
              id="tenant-secondary-color-text"
              class="flex-1"
              pInputText
              [ngModel]="form().brandingSecondaryColor"
              (ngModelChange)="update('brandingSecondaryColor', $event)"
              placeholder="#0369a1"
            />
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" styleClass="p-button-text" (onClick)="canceled.emit()" />
          <p-button label="Guardar" [disabled]="!isValid() || saving()" [loading]="saving()" (onClick)="save()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    :host {
      display: block;
    }

    label {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantModal {
  readonly visible = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly tenant = input<TenantListItemDTO | null>(null);
  readonly statusOptions = input.required<ISelectList[]>();

  readonly canceled = output<void>();
  readonly submitted = output<TenantFormValue>();

  protected readonly form = signal<TenantFormValue>({
    id: undefined,
    slug: '',
    name: '',
    legalName: '',
    documentType: '',
    documentNumber: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'UTC',
    currency: 'USD',
    status: 'active',
    brandingLogoUrl: '',
    brandingPrimaryColor: '',
    brandingSecondaryColor: '',
  });

  protected readonly isEdit = computed(() => Boolean(this.tenant()));
  protected readonly title = computed(() => (this.tenant() ? 'Editar tenant' : 'Nuevo tenant'));
  protected readonly isValid = computed(() => {
    const form = this.form();
    if (form.name.trim().length < 2) return false;

    if (this.isEdit()) return true;

    return (
      form.slug.trim().length >= 2 &&
      form.documentType.trim().length >= 2 &&
      form.documentNumber.trim().length >= 3
    );
  });

  constructor() {
    effect(() => {
      const tenant = this.tenant();
      this.form.set({
        id: tenant?.id,
        slug: tenant?.slug ?? '',
        name: tenant?.name ?? '',
        legalName: tenant?.legalName ?? '',
        documentType: tenant?.documentType ?? '',
        documentNumber: tenant?.documentNumber ?? '',
        email: tenant?.email ?? '',
        phone: tenant?.phone ?? '',
        address: tenant?.address ?? '',
        timezone: tenant?.timezone ?? 'UTC',
        currency: tenant?.currency ?? 'USD',
        status: tenant?.status ?? 'active',
        brandingLogoUrl: tenant?.branding?.logoUrl ?? '',
        brandingPrimaryColor: tenant?.branding?.primaryColor ?? '',
        brandingSecondaryColor: tenant?.branding?.secondaryColor ?? '',
      });
    });
  }

  protected update<K extends keyof TenantFormValue>(key: K, value: TenantFormValue[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.canceled.emit();
    }
  }

  protected save(): void {
    const cleanStatus = this.normalizeStatus(this.form().status);

    this.submitted.emit({
      ...this.form(),
      slug: this.form().slug.trim().toLowerCase(),
      name: this.form().name.trim(),
      legalName: this.form().legalName.trim(),
      documentType: this.form().documentType.trim(),
      documentNumber: this.form().documentNumber.trim(),
      email: this.form().email.trim(),
      phone: this.form().phone.trim(),
      address: this.form().address.trim(),
      timezone: this.form().timezone.trim() || 'UTC',
      currency: this.form().currency.trim().toUpperCase() || 'USD',
      status: cleanStatus,
      brandingLogoUrl: this.form().brandingLogoUrl.trim(),
      brandingPrimaryColor: this.form().brandingPrimaryColor.trim(),
      brandingSecondaryColor: this.form().brandingSecondaryColor.trim(),
    });
  }

  private normalizeStatus(value: TenantStatus | string): TenantStatus {
    if (value === 'active' || value === 'suspended' || value === 'archived') {
      return value;
    }

    return 'active';
  }
}
