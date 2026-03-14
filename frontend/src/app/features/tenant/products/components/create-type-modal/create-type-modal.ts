import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { INewProductTypeWithAttributes, ProductAttributeType } from '../../interfaces/product-settings';

@Component({
  selector: 'app-create-product-type-modal',
  template: `
    <p-dialog
      header="Nuevo tipo de producto"
      [visible]="visible()"
      [modal]="true"
      [style]="{ width: '80%', height: '80%' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="handleClose()"
    >
      <form class="grid gap-4" [formGroup]="form" (ngSubmit)="handleSubmit()">
        <div class="grid gap-2">
          <label class="text-sm font-medium text-surface-900" for="name">Nombre del tipo</label>
          <input
            pInputText
            id="name"
            type="text"
            formControlName="name"
            placeholder="Ej. Electrónica industrial"
            autocomplete="off"
          />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <p class="text-xs text-red-500">El nombre es requerido.</p>
          }
        </div>

        <div class="flex items-center justify-between rounded-lg border border-surface-200 px-3 py-2 bg-surface-50">
          <div>
            <p class="text-sm font-medium text-surface-900">Activo para nuevas altas</p>
            <p class="text-xs text-surface-600">Controla si el tipo aparece en formularios y carga masiva.</p>
          </div>
          <p-toggleSwitch formControlName="isActive"></p-toggleSwitch>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-surface-900">Atributos del tipo</p>
            <p-button type="button" label="Agregar atributo" icon="pi pi-plus" styleClass="p-button-text p-button-sm" (onClick)="addAttribute()"></p-button>
          </div>

          <div class="space-y-3" formArrayName="attributes">
            @for (attr of attributes.controls; track $index) {
              <div class="rounded-lg border border-surface-200 p-3" [formGroupName]="$index">
                <div class="grid gap-2 sm:grid-cols-2">
                  <div class="grid gap-1">
                    <label class="text-xs font-medium text-surface-900">Key</label>
                    <input pInputText type="text" formControlName="key" placeholder="sku" autocomplete="off" />
                  </div>
                  <div class="grid gap-1">
                    <label class="text-xs font-medium text-surface-900">Label</label>
                    <input pInputText type="text" formControlName="label" placeholder="SKU" autocomplete="off" />
                  </div>
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <div class="grid gap-1">
                    <label class="text-xs font-medium text-surface-900">Tipo</label>
                    <p-select
                      [options]="attributeTypes"
                      optionLabel="label"
                      optionValue="value"
                      formControlName="type"
                      styleClass="w-full"
                    ></p-select>
                  </div>

                  @if (attr.get('type')?.value === 'select' || attr.get('type')?.value === 'multiselect') {
                    <div class="grid gap-1">
                      <label class="text-xs font-medium text-surface-900">Opciones (coma-separado)</label>
                      <input pInputText type="text" formControlName="options" placeholder="Rojo, Azul" autocomplete="off" />
                    </div>
                  }
                </div>

                <div class="flex items-center justify-between pt-1">
                  <div class="flex items-center gap-2">
                    <p-toggleSwitch formControlName="required"></p-toggleSwitch>
                    <span class="text-xs text-surface-700">Requerido</span>
                  </div>
                  @if (attributes.length > 1) {
                    <p-button type="button" icon="pi pi-times" styleClass="p-button-text p-button-sm" (onClick)="removeAttribute($index)"></p-button>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <p-button type="button" label="Cancelar" styleClass="p-button-outlined p-button-sm" (onClick)="handleClose()"></p-button>
          <p-button type="submit" label="Crear" icon="pi pi-check" styleClass="p-button-success p-button-sm" [disabled]="form.invalid"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, ReactiveFormsModule, InputTextModule, ToggleSwitchModule, ButtonModule, SelectModule]
})
export class CreateProductTypeModal {
  readonly visible = input<boolean>(false);
  readonly closed = output<void>();
  readonly submitted = output<INewProductTypeWithAttributes>();

  private readonly fb = inject(FormBuilder);

  protected attributeTypes: Array<{ label: string; value: ProductAttributeType }> = [
    { label: 'Texto', value: 'text' },
    { label: 'Número', value: 'number' },
    { label: 'Fecha', value: 'date' },
    { label: 'Select', value: 'select' },
    { label: 'Multiselect', value: 'multiselect' },
    { label: 'Boolean', value: 'boolean' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    isActive: true,
    attributes: this.fb.nonNullable.array([this.buildAttribute()]),
  });

  get attributes(): FormArray {
    return this.form.controls.attributes;
  }

  private buildAttribute() {
    return this.fb.nonNullable.group({
      key: ['', Validators.required],
      label: ['', Validators.required],
      type: this.attributeTypes?.[0]?.value ?? 'text',
      required: false,
      options: '',
    });
  }

  addAttribute() {
    this.attributes.push(this.buildAttribute());
  }

  removeAttribute(index: number) {
    if (this.attributes.length > 1) {
      this.attributes.removeAt(index);
    }
  }

  handleClose() {
    this.closed.emit();
    this.form.reset({ name: '', isActive: true });
    this.form.setControl('attributes', this.fb.nonNullable.array([this.buildAttribute()]));
  }

  handleSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const attributes = raw.attributes.map(attr => ({
      key: attr.key.trim(),
      label: attr.label.trim(),
      type: attr.type,
      required: attr.required,
      options: this.normalizeOptions(attr.options, attr.type),
    }));

    this.submitted.emit({
      name: raw.name.trim(),
      isActive: raw.isActive,
      attributes,
    });
    this.handleClose();
  }

  private normalizeOptions(optionsRaw: string, type: ProductAttributeType): ReadonlyArray<string> | undefined {
    if (type !== 'select' && type !== 'multiselect') {
      return undefined;
    }
    const values = optionsRaw
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    return values.length ? values : undefined;
  }
}
