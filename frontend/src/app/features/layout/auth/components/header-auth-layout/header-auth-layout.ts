import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { LayoutAdminData } from '../../services/layout-admin-data';
import { TenantContext } from '../../../../../@core/services/tenant/tenant-context';
import { TenantApi } from '../../../../super-admin/tenants/services/tenant-api';
import { Auth } from '../../../../../@core/services/auth/auth';
import { AuthApi } from '../../../../../@core/services/auth/auth-api';
import { take } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';
import { PasswordChangeModal } from '../../../../super-admin/users/components/password-change-modal/password-change-modal';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-header-auth-layout',
  imports: [ButtonModule, MenuModule, PasswordChangeModal, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="header-bar">
      <div class="brand-wrap">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">Admin</span>
          <span class="brand-name">Panel</span>
        </div>

        @if (tenantViewLabel(); as tenant) {
          <div class="tenant-pill" aria-live="polite">
            <span class="tenant-mode">Vista tenant</span>
            <span class="tenant-name">{{ tenant.name }}</span>
          </div>
        }
      </div>

      <div class="header-actions">
        @if (isTenantView()) {
          <p-button
            label="Salir de vista tenant"
            icon="pi pi-arrow-left"
            styleClass="p-button-outlined"
            severity="contrast"
            (onClick)="exitTenantView()"
            aria-label="Salir de vista tenant"
          />
        }

<p-button
          label="Admin user"
          icon="pi pi-user"
          styleClass="user-button p-button-rounded p-button-outlined"
          severity="secondary"
          aria-label="Cuenta del usuario"
          (onClick)="userMenu.toggle($event)"
        />
        <p-menu
          #userMenu
          [model]="menuItems"
          [popup]="true"
          appendTo="body"
        />
      </div>
    </div>
    <app-password-change-modal
      [visible]="showPasswordChangeModal()"
      [saving]="savingPasswordChange()"
      (submitted)="onPasswordChangeSubmitted($event)"
      (canceled)="onPasswordChangeCanceled()"
    />
  `,
  styles: `
    :host {
      display: block;
    }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 60%, transparent 100%),
        var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      color: var(--text-color);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: var(--primary-color);
      color: var(--primary-contrast-color);
      font-size: 0.85rem;
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
    }

    .brand-name {
      font-size: 1.05rem;
      color: var(--text-color);
    }

    .tenant-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.6rem;
      border: 1px solid var(--surface-border);
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.03);
      color: var(--text-color);
      min-width: 0;
    }

    .tenant-mode {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
    }

    .tenant-name {
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 18rem;
    }

    .user-button {
      border-color: var(--surface-border);
      color: var(--text-color);
    }

    .user-button:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
    }

    @media (max-width: 640px) {
      .header-bar {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .brand-wrap {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
      }

      .brand-name {
        font-size: 1rem;
      }

      .tenant-name {
        max-width: 11rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAuthLayout {
  private readonly router = inject(Router);
  private readonly layoutData = inject(LayoutAdminData);
  private readonly tenantContext = inject(TenantContext);
  private readonly tenantApi = inject(TenantApi);
  private readonly auth = inject(Auth);
  private readonly authApi = inject(AuthApi);
  private readonly messageService = inject(MessageService);

  protected readonly isTenantView = this.layoutData.isTenantView;
  protected readonly tenantViewLabel = this.layoutData.tenantViewLabel;
  protected readonly showPasswordChangeModal = signal(false);
  protected readonly savingPasswordChange = signal(false);

  protected readonly menuItems: MenuItem[] = [
    {
      label: 'Cambiar contraseña',
      icon: 'pi pi-key',
      command: () => this.showPasswordChangeModal.set(true),
    },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => this.auth.logout(),
    },
  ];

  constructor() {
    effect(() => {
      if (!this.isTenantView()) {
        return;
      }

      const tenantId = this.tenantContext.activeTenantId();
      const info = this.tenantContext.tenantInfo();

      if (!tenantId || info?.id === tenantId) {
        return;
      }

      this.tenantApi
        .list({ search: '', status: '', page: 1, pageSize: 50 })
        .pipe(take(1))
        .subscribe({
          next: (result) => {
            const tenant = result.data.find((item) => item.id === tenantId);
            if (tenant) {
              this.tenantContext.setTenantInfo({ id: tenant.id, name: tenant.name });
            }
          },
          error: () => undefined,
          complete: () => undefined,
        });
    });
  }

protected exitTenantView(): void {
    this.tenantContext.clear();
    this.router.navigate(['/admin/tenants']);
  }

  protected onPasswordChangeCanceled(): void {
    this.showPasswordChangeModal.set(false);
  }

  protected onPasswordChangeSubmitted(event: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): void {
    this.savingPasswordChange.set(true);

    this.authApi.changePassword(event).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: response.message,
            life: 3000,
          });
          this.showPasswordChangeModal.set(false);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message,
            life: 5000,
          });
        }
      },
      error: (err: { message?: string }) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message ?? 'Error al cambiar la contraseña',
          life: 5000,
        });
      },
      complete: () => {
        this.savingPasswordChange.set(false);
      },
    });
  }
}
