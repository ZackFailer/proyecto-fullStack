import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { UserDTO, UserRole } from '../../interfaces/user';
import { PrivilegedPasswordPayload } from '../../interfaces/user';

export interface PrivilegedPasswordChangeValue {
  adminPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-privileged-password-modal',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    DividerModule,
  ],
  template: `
    <p-dialog
      [modal]="true"
      [style]="{ width: '90%', maxWidth: '28rem' }"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      [visible]="visible()"
      (onHide)="onCancel()"
      header="Cambiar contraseña"
    >
      <div class="mb-4 text-sm text-surface-600">
        <p>Cambiando contraseña de:</p>
        <p class="font-medium text-surface-900">{{ targetUser()?.fullName }}</p>
        <p class="text-xs">({{ targetUser()?.role }})</p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        @if (requiresAdminPassword()) {
          <div class="flex flex-col gap-2">
            <label class="text-sm text-surface-700" for="adminPassword">
              Tu contraseña de admin
            </label>
            <p-password
              id="adminPassword"
              formControlName="adminPassword"
              [feedback]="false"
              [toggleMask]="true"
              fluid
              placeholder="Ingresa tu contraseña actual"
              styleClass="w-full"
            />
            @if (form.controls.adminPassword.invalid && form.controls.adminPassword.touched) {
              <span class="text-xs text-red-500">Tu contraseña de admin es requerida</span>
            }
          </div>
        }

        <div class="flex flex-col gap-2">
          <label class="text-sm text-surface-700" for="newPassword">
            Nueva contraseña
          </label>
          <p-password
            id="newPassword"
            formControlName="newPassword"
            [feedback]="true"
            [toggleMask]="true"
            fluid
            placeholder="Mínimo 12 caracteres"
            [promptLabel]="'Define una contraseña fuerte'"
            [weakLabel]="'Débil'"
            [mediumLabel]="'Media'"
            [strongLabel]="'Fuerte'"
            styleClass="w-full"
          />
          @if (form.controls.newPassword.invalid && form.controls.newPassword.touched) {
            <span class="text-xs text-red-500">
              Mínimo 12 caracteres, incluye mayúsculas, minúsculas, número y símbolo
            </span>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm text-surface-700" for="confirmPassword">
            Confirmar nueva contraseña
          </label>
          <p-password
            id="confirmPassword"
            formControlName="confirmPassword"
            [feedback]="false"
            [toggleMask]="true"
            fluid
            placeholder="Repite la nueva contraseña"
            styleClass="w-full"
          />
          @if (form.controls.confirmPassword.invalid && form.controls.confirmPassword.touched) {
            @if (form.controls.confirmPassword.errors?.['required']) {
              <span class="text-xs text-red-500">Confirma la nueva contraseña</span>
            } @else if (form.controls.confirmPassword.errors?.['mismatch']) {
              <span class="text-xs text-red-500">Las contraseñas no coinciden</span>
            }
          }
        </div>

        <p-divider></p-divider>

        <div class="flex items-center justify-end gap-2">
          <p-button
            type="button"
            label="Cancelar"
            styleClass="p-button-text"
            severity="secondary"
            (onClick)="onCancel()"
          />
          <p-button
            type="submit"
            label="Cambiar contraseña"
            [loading]="saving()"
            icon="pi pi-key"
            severity="danger"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    :host {
      display: block;
    }

    :host ::ng-deep .p-password {
      width: 100%;
    }

    :host ::ng-deep .p-password-input {
      width: 100%;
    }

    :host ::ng-deep .p-dialog-header {
      border-bottom: 1px solid var(--surface-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivilegedPasswordModal {
  readonly visible = input(false);
  readonly saving = input(false);
  readonly targetUser = input<UserDTO | null>(null);
  readonly currentUserRole = input<UserRole>('admin');

  readonly submitted = output<PrivilegedPasswordChangeValue>();
  readonly canceled = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly requiresAdminPassword = computed(() => this.currentUserRole() === 'admin');

  readonly form = this.fb.nonNullable.group(
    {
      adminPassword: [''],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  constructor() {
    this.form.controls.newPassword.addValidators(passwordStrengthValidator);

    effect(() => {
      const requiresPw = this.requiresAdminPassword();
      const adminControl = this.form.controls.adminPassword;

      if (requiresPw) {
        adminControl.setValidators([Validators.required]);
      } else {
        adminControl.clearValidators();
      }
      adminControl.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      if (!this.visible()) {
        this.form.reset(
          {
            adminPassword: '',
            newPassword: '',
            confirmPassword: '',
          },
          { emitEvent: false }
        );
      }
    });
  }

  onCancel(): void {
    this.form.reset(
      {
        adminPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      { emitEvent: false }
    );
    this.canceled.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: PrivilegedPasswordChangeValue = {
      adminPassword: raw.adminPassword || undefined,
      newPassword: raw.newPassword,
      confirmPassword: raw.confirmPassword,
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

function passwordMatchValidator(group: AbstractControl) {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword ? null : { mismatch: true };
}