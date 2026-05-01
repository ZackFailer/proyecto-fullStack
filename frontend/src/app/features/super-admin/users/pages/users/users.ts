import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';

import { UserFilters } from '../../components/user-filters/user-filters';
import { UserTable } from '../../components/user-table/user-table';
import UserModal from '../../components/user-modal/user-modal';
import { UserDTO, UserRole, UserStatus } from '../../interfaces/user';
import { UserFormValue, UserStore } from '../../services/user-store';

@Component({
  selector: 'app-users-page',
  imports: [ToastModule, ConfirmDialogModule, UserFilters, UserTable, UserModal],
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="grid gap-4">
      <app-user-filters
        [filters]="filters()"
        [roleOptions]="roleOptions()"
        [statusOptions]="statusOptions()"
        [showCreate]="showCreate()"
        [showRoleFilter]="showRoleFilter()"
        (searchChanged)="onSearch($event)"
        (roleChanged)="onRoleChange($event)"
        (statusChanged)="onStatusChange($event)"
        (createRequested)="onCreateUser()"
        (refreshRequested)="refresh()"
        (clearRequested)="onClearFilters()"
      />

      <div class="grid gap-3 md:grid-cols-4">
        <div class="stat-card">
          <p class="text-xs uppercase tracking-[0.24em] text-surface-500">Totales</p>
          <p class="text-2xl font-semibold text-surface-900">{{ stats().total }}</p>
          <span class="text-xs text-surface-500">Usuarios en el sistema</span>
        </div>
        <div class="stat-card">
          <p class="text-xs uppercase tracking-[0.24em] text-emerald-600">Activos</p>
          <p class="text-2xl font-semibold text-surface-900">{{ stats().active }}</p>
          <span class="text-xs text-surface-500">Con acceso vigente</span>
        </div>
        <div class="stat-card">
          <p class="text-xs uppercase tracking-[0.24em] text-amber-600">Pendientes</p>
          <p class="text-2xl font-semibold text-surface-900">{{ stats().pending }}</p>
          <span class="text-xs text-surface-500">Invitados sin activar</span>
        </div>
        <div class="stat-card">
          <p class="text-xs uppercase tracking-[0.24em] text-red-600">Suspendidos</p>
          <p class="text-2xl font-semibold text-surface-900">{{ stats().suspended }}</p>
          <span class="text-xs text-surface-500">Acceso temporalmente bloqueado</span>
        </div>
      </div>

      <app-user-table
        [users]="tableUsers()"
        [meta]="meta()"
        [loading]="loading()"
        [pageSizeOptions]="pageSizeOptions"
        [showActions]="showActions()"
        (edit)="onEdit($event)"
        (toggleStatus)="onToggleStatus($event)"
        (pageChange)="onPageChange($event)"
      />
    </div>

    <app-user-modal
      [visible]="modalOpen()"
      [user]="selectedUser()"
      [saving]="saving()"
      [roleOptions]="roleOptions()"
      [statusOptions]="statusOptions()"
      (submitted)="onSubmitUser($event)"
      (canceled)="onCancelModal()"
    />
  `,
  styles: `
    :host {
      display: block;
    }

    .stat-card {
      border: 1px solid var(--surface-border);
      border-radius: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.06));
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
    }
  `,
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPage {
  private readonly store = inject(UserStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (params) => this.store.setScope(params.get('tenantId')),
      error: () => this.store.setScope(this.route.snapshot.paramMap.get('tenantId')),
      complete: () => undefined,
    });
  }

  protected readonly filters = this.store.filters;
  protected readonly roleOptions = this.store.roleOptions;
  protected readonly statusOptions = this.store.statusOptions;
  protected readonly tableUsers = this.store.tableUsers;
  protected readonly meta = this.store.meta;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly modalOpen = this.store.modalOpen;
  protected readonly selectedUser = this.store.selectedUser;
  protected readonly stats = this.store.stats;
  protected readonly showCreate = this.store.showCreate;
  protected readonly showRoleFilter = this.store.showRoleFilter;
  protected readonly showActions = this.store.showActions;

  protected readonly pageSizeOptions = [10, 25, 50];

  onSearch(term: string): void {
    this.store.setSearch(term);
  }

  onRoleChange(role: UserRole | ''): void {
    this.store.setRole(role ?? '');
  }

  onStatusChange(status: UserStatus | ''): void {
    this.store.setStatus(status ?? '');
  }

  onPageChange(change: { page: number; pageSize: number }): void {
    this.store.setPage(change.page, change.pageSize);
  }

  onCreateUser(): void {
    this.store.openCreate();
  }

  onEdit(user: UserDTO): void {
    this.store.openEdit(user);
  }

  onCancelModal(): void {
    this.store.closeModal();
  }

  onSubmitUser(payload: UserFormValue): void {
    const isEdit = Boolean(payload.id);
    this.store
      .saveUser(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: user => {
          const label = `${user.fullName}` || user.email;
          this.messages.add({
            severity: 'success',
            summary: isEdit ? 'Usuario actualizado' : 'Usuario creado',
            detail: label,
            life: 2500,
          });
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el usuario' });
        }
      });
  }

  onToggleStatus(user: UserDTO): void {
    const action = user.status === 'active' ? 'Suspender' : 'Reactivar';
    this.confirmation.confirm({
      header: 'Confirmar estado',
      message: `${action} a ${user.fullName}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: action,
      rejectLabel: 'Cancelar',
      accept: () => {
        this.store
          .toggleStatus(user)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: updated => {
              const detail = `${updated.fullName} → ${this.statusLabel(updated.status)}`;
              this.messages.add({ severity: 'info', summary: 'Estado actualizado', detail });
            },
            error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' })
          });
      }
    });
  }

  refresh(): void {
    this.store.load();
  }

  onClearFilters(): void {
    this.store.resetFilters();
  }

  private statusLabel(status: UserStatus): string {
    if (status === 'active') return 'Activo';
    if (status === 'suspended') return 'Suspendido';
    if (status === 'invited') return 'Invitado';
    return 'Eliminado';
  }
}
