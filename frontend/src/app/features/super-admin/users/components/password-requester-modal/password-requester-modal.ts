import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { UserDTO } from '../../interfaces/user';

export interface PasswordRequestValue {
  targetUserId: string;
  reason?: string;
}

@Component({
  selector: 'app-password-request-modal',
  imports: [DialogModule, ReactiveFormsModule, TextareaModule, ButtonModule],
  template: `
    <p-dialog
      [modal]="true"
      [style]="{ width: '90%', maxWidth: '26rem' }"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      [visible]="visible()"
      (onHide)="onCancel()"
      header="Solicitar cambio de contraseña"
      [styleClass]="'password-request--dialog'"
    >
      <div class="mb-4 text-sm text-surface-600">
        <p>Estás solicitando un cambio de contraseña para:</p>
        <p class="font-medium text-surface-900">{{ targetUser()?.fullName }}</p>
        <p class="text-xs">({{ targetUser()?.email }})</p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div class="flex flex-col gap-2">
          <label class="text-sm text-surface-700" for="reason">
            Razón (opcional)
          </label>
          <textarea
            id="reason"
            formControlName="reason"
            rows="3"
            pTextarea
            fluid
            placeholder="Describe brevemente por qué se solicita este cambio..."
            styleClass="w-full resize-none"
          ></textarea>
          <p class="text-xs text-surface-500">
            Este requerimiento será enviado al superadmin para su aprobación.
          </p>
        </div>

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
            label="Solicitar cambio"
            [loading]="saving()"
            icon="pi pi-send"
            severity="info"
          />
        </div>
      </form>
    </p-dialog>
  `,
  styles: `
    :host {
      display: block;
    }

    :host ::ng--deep .p-dialog-header {
      border-bottom: 1px solid var(--surface-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRequestModal {
  readonly visible = input(false);
  readonly saving = input(false);
  readonly targetUser = input<UserDTO | null>(null);

  readonly submitted = output<PasswordRequestValue>();
  readonly canceled = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.form.reset({ reason: '' }, { emitEvent: false });
      }
    });
  }

  onCancel(): void {
    this.form.reset({ reason: '' }, { emitEvent: false });
    this.canceled.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.targetUser();
    if (!user?.id) return;

    const raw = this.form.getRawValue();
    const payload: PasswordRequestValue = {
      targetUserId: user.id,
      reason: raw.reason || undefined,
    };

    this.submitted.emit(payload);
  }
}