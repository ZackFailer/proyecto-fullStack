import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { UserDTO, UserRole, UserStatus } from '../../interfaces/user';
import { UserFormValue } from '../../services/user-store';

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-user-modal',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputText,
    PasswordModule,
    SelectModule,
    ButtonModule,
    DividerModule,
  ],
  template: `
    <p-dialog
      [modal]="true"
      [style]="{ width: '80%' }"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [visible]="visible()"
      (onHide)="onCancel()"
      header="{{ isEdit() ? 'Editar usuario' : 'Crear usuario' }}"
    >
      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm text-surface-700" for="firstName">
            Nombre
            <input
              id="firstName"
              pInputText
              type="text"
              formControlName="firstName"
              placeholder="Camila"
            />
            @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
              <span class="text-xs text-red-500">Requerido (1-30 caracteres)</span>
            }
          </label>
          <label class="flex flex-col gap-2 text-sm text-surface-700" for="lastName">
            Apellido
            <input
              id="lastName"
              pInputText
              type="text"
              formControlName="lastName"
              placeholder="Lopez"
            />
            @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
              <span class="text-xs text-red-500">Requerido (1-30 caracteres)</span>
            }
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col gap-2 text-sm text-surface-700" for="email">
            Correo
            <input
              id="email"
              pInputText
              type="email"
              formControlName="email"
              placeholder="ejemplo@gmail.com"
            />
            @if (form.controls.email.invalid && form.controls.email.touched) {
              <span class="text-xs text-red-500">Usa un correo valido (5-60 caracteres)</span>
            }
          </label>

          @if (!isEdit()) {
            <div class="flex flex-col gap-2 text-sm text-surface-700">
              <label for="password"> Password </label>
              <p-password
                id="password"
                formControlName="password"
                [feedback]="true"
                [toggleMask]="true"
                fluid
                placeholder="Minimo 12 caracteres"
                [promptLabel]="'Define una contrasena fuerte'"
                [weakLabel]="'Debil'"
                [mediumLabel]="'Media'"
                [strongLabel]="'Fuerte'"
              />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <span class="text-xs text-red-500"
                  >Minimo 12 caracteres, incluye mayusculas, minusculas, numero y simbolo.</span
                >
              }
            </div>
          }
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm text-surface-700" for="role">
            Rol
            <p-select
              id="role"
              formControlName="role"
              [options]="roleOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un rol"
            />
            @if (form.controls.role.invalid && form.controls.role.touched) {
              <span class="text-xs text-red-500">Selecciona un rol</span>
            }
          </label>

          <label class="flex flex-col gap-2 text-sm text-surface-700" for="status">
            Estado
            <p-select
              id="status"
              formControlName="status"
              [options]="statusOptions()"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona estado"
            />
          </label>
        </div>

        <label class="flex flex-col gap-2 text-sm text-surface-700" for="phone">
          Telefono (opcional)
          <input
            id="phone"
            pInputText
            type="tel"
            formControlName="phone"
            placeholder="+57 300 000 0000"
          />
        </label>

        <p-divider></p-divider>

        <div class="flex items-center justify-between gap-2">
          <div class="text-xs text-surface-600">
            {{
              isEdit()
                ? 'Edita rol, estado o perfil sin salir de la vista.'
                : 'El usuario se crea activo o con invitacion pendiente.'
            }}
          </div>
          <div class="flex gap-2">
            <p-button
              type="button"
              label="Cancelar"
              styleClass="p-button-text"
              (onClick)="onCancel()"
            />
            <p-button
              type="submit"
              label="{{ isEdit() ? 'Guardar cambios' : 'Crear usuario' }}"
              [loading]="saving()"
              icon="pi pi-check"
            />
          </div>
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    :host {
      display: block;
    }
    p-dialog ::ng-deep .p-dialog-header {
      border-bottom: 1px solid var(--surface-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserModal {
  readonly visible = input(false);
  readonly user = input<UserDTO | null>(null);
  readonly saving = input(false);
  readonly roleOptions = input.required<Option<UserRole>[]>();
  readonly statusOptions = input.required<Option<UserStatus>[]>();

  readonly submitted = output<UserFormValue>();
  readonly canceled = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]],
    lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]],
    email: [
      '',
      [Validators.required, Validators.email, Validators.minLength(5), Validators.maxLength(60)],
    ],
    role: this.fb.nonNullable.control<UserRole>('viewer', Validators.required),
    status: this.fb.nonNullable.control<UserStatus>('active', Validators.required),
    phone: this.fb.control<string | null>(null, [Validators.maxLength(20)]),
    password: this.fb.control<string>('', [Validators.required]),
  });

  readonly isEdit = computed(() => Boolean(this.user()));

  private formStateKey: string | null = null;

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const current = this.user();
      const nextKey = isVisible ? (current?.id ?? '__create__') : null;

      if (nextKey === this.formStateKey) {
        return;
      }

      this.formStateKey = nextKey;

      if (!isVisible) {
        return;
      }

      if (current) {
        const { firstName, lastName } = splitFullName(current.fullName);
        this.form.reset(
          {
            firstName,
            lastName,
            email: current.email,
            role: current.role,
            status: current.status,
            phone: current.phone ?? null,
            password: '',
          },
          { emitEvent: false }
        );
        this.form.controls.email.disable({ emitEvent: false });
        this.form.controls.password.disable({ emitEvent: false });
      } else {
        this.form.reset(
          {
            firstName: '',
            lastName: '',
            email: '',
            role: 'viewer',
            status: 'active',
            phone: null,
            password: '',
          },
          { emitEvent: false }
        );
        this.form.controls.email.enable({ emitEvent: false });
        this.form.controls.password.enable({ emitEvent: false });
      }
    });

    this.form.controls.password.addValidators(passwordStrengthValidator);
  }

  onCancel() {
    this.canceled.emit();
  }

  submit() {
    if (this.form.invalid) {
      console.log(this.form);
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UserFormValue = {
      id: this.user()?.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      role: raw.role,
      status: raw.status,
      phone: raw.phone,
      password: raw.password || undefined,
    };

    this.submitted.emit(payload);
  }
}

function passwordStrengthValidator(control: AbstractControl) {
  if (!control.value) {
    return null;
  }

  const value: string = control.value;
  const hasMinLength = value.length >= 12;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  return hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol
    ? null
    : { weakPassword: true };
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}
