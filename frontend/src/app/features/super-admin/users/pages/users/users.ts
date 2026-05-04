import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { UserFilters } from '../../components/user-filters/user-filters';
import { UserTable } from '../../components/user-table/user-table';
import UserModal from '../../components/user-modal/user-modal';
import { PrivilegedPasswordModal } from '../../components/privileged-password-modal/privileged-password-modal';
import { PasswordRequestModal } from '../../components/password-requester-modal/password-requester-modal';
import { UserDTO, UserRole, UserStatus } from '../../interfaces/user';
import { UserFormValue, UserStore } from '../../services/user-store';
import { PrivilegedPasswordChangeValue } from '../../components/privileged-password-modal/privileged-password-modal';
import { PasswordRequestValue } from '../../components/password-requester-modal/password-requester-modal';

@Component({
  selector: 'app-users-page',
  imports: [ToastModule, ConfirmDialogModule, UserFilters, UserTable, UserModal, PrivilegedPasswordModal, PasswordRequestModal],
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="grid gap-4">
      <app-user-filters
        [filters]="filters()" [roleOptions]="roleOptions()" [statusOptions]="statusOptions()"
        [showCreate]="showCreate()" [showRoleFilter]="showRoleFilter()"
        (searchChanged)="onSearch($event)" (roleChanged)="onRoleChange($event)" (statusChanged)="onStatusChange($event)"
        (createRequested)="onCreateUser()" (refreshRequested)="refresh()" (clearRequested)="onClearFilters()"
      />

      <div class="grid gap-3 md:grid-cols-4">
        <div class="stat-card"><p class="text-xs uppercase tracking-[0.24em] text-surface-500">Totales</p><p class="text-2xl font-semibold text-surface-900">{{ stats().total }}</p><span class="text-xs text-surface-500">Usuarios en el sistema</span></div>
        <div class="stat-card"><p class="text-xs uppercase tracking-[0.24em] text-emerald-600">Activos</p><p class="text-2xl font-semibold text-surface-900">{{ stats().active }}</p><span class="text-xs text-surface-500">Con acceso vigente</span></div>
        <div class="stat-card"><p class="text-xs uppercase tracking-[0.24em] text-amber-600">Pendientes</p><p class="text-2xl font-semibold text-surface-900">{{ stats().pending }}</p><span class="text-xs text-surface-500">Invitados sin activar</span></div>
        <div class="stat-card"><p class="text-xs uppercase tracking-[0.24em] text-red-600">Suspendidos</p><p class="text-2xl font-semibold text-surface-900">{{ stats().suspended }}</p><span class="text-xs text-surface-500">Acceso temporalmente bloqueado</span></div>
      </div>

      <app-user-table [users]="tableUsers()" [meta]="meta()" [loading]="loading()" [pageSizeOptions]="pageSizeOptions"
        [currentUserRole]="currentUserRole()"
        (edit)="onEdit($event)" (toggleStatus)="onToggleStatus($event)" (pageChange)="onPageChange($event)"
      />
    </div>

    <app-user-modal [visible]="modalOpen()" [user]="selectedUser()" [saving]="saving()"
      [roleOptions]="roleOptions()" [statusOptions]="statusOptions()" [currentUserRole]="currentUserRole()"
      [canMutate]="showActions()"
      (submitted)="onSubmitUser($event)" (canceled)="onCancelModal()" (changePasswordRequested)="onChangePassword($event)"
      (passwordRequestRequested)="onRequestPasswordChange($event)"
    />

    <app-privileged-password-modal [visible]="privilegedPasswordModalOpen()" [targetUser]="selectedUser()"
      [saving]="saving()" [currentUserRole]="currentUserRole()"
      (submitted)="onSubmitPasswordChange($event)" (canceled)="onCancelPasswordChange()"
    />

    <app-password-request-modal [visible]="passwordRequestModalOpen()" [targetUser]="selectedUser()" [saving]="saving()"
      (submitted)="onSubmitPasswordRequest($event)" (canceled)="onCancelPasswordRequest()"
    />
  `,
  styles: `
    :host { display: block; }
    .stat-card { border: 1px solid var(--surface-border); border-radius: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.06)); box-shadow: var(--shadow-1); }
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
    this.destroyRef.onDestroy(() => { this.store.setScope(null); });
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
  protected readonly privilegedPasswordModalOpen = this.store.privilegedPasswordModalOpen;
  protected readonly passwordRequestModalOpen = this.store.passwordRequestModalOpen;
  protected readonly currentUserRole = this.store.currentUserRole;
  protected readonly pageSizeOptions = [10, 25, 50];

  onSearch(term: string): void { this.store.setSearch(term); }
  onRoleChange(role: UserRole | ''): void { this.store.setRole(role ?? ''); }
  onStatusChange(status: UserStatus | ''): void { this.store.setStatus(status ?? ''); }
  onPageChange(change: { page: number; pageSize: number }): void { this.store.setPage(change.page, change.pageSize); }
  onCreateUser(): void { this.store.openCreate(); }
  onEdit(user: UserDTO): void { this.store.openEdit(user); }
  onCancelModal(): void { this.store.closeModal(); }
  refresh(): void { this.store.load(); }
  onClearFilters(): void { this.store.resetFilters(); }
  onChangePassword(user: UserDTO): void { this.store.openPrivilegedPasswordChange(user); }
  onRequestPasswordChange(user: UserDTO): void { this.store.openPasswordRequestModal(user); }

  onSubmitUser(payload: UserFormValue): void {
    const isEdit = Boolean(payload.id);
    this.store.saveUser(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => { this.messages.add({ severity: 'success', summary: isEdit ? 'Usuario actualizado' : 'Usuario creado', detail: user.fullName || user.email, life: 25000 }); },
      error: () => { this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el usuario' }); }
    });
  }

  onToggleStatus(user: UserDTO): void {
    const action = user.status === 'active' ? 'Suspender' : 'Reactivar';
    this.confirmation.confirm({ header: 'Confirmar estado', message: `${action} a ${user.fullName}?`, icon: 'pi pi-exclamation-triangle', acceptLabel: action, rejectLabel: 'Cancelar',
      accept: () => { this.store.toggleStatus(user).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: u => { this.messages.add({ severity: 'info', summary: 'Estado actualizado', detail: `${u.fullName} → ${this.statusLabel(u.status)}` }); }, error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' }) }); }
    });
  }

  onSubmitPasswordChange(payload: PrivilegedPasswordChangeValue): void {
    const user = this.store.selectedUser(); if (!user?.id) return;
    this.store.changePasswordPrivileged(user.id, { adminPassword: payload.adminPassword, newPassword: payload.newPassword }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: 'Contraseña actualizada', detail: `La contraseña de ${user.fullName} ha sido cambiada`, life: 3000 }); },
      error: () => { this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar la contraseña.' }); }
    });
  }
  onCancelPasswordChange(): void { this.store.closePrivilegedPasswordModal(); }

  onSubmitPasswordRequest(payload: PasswordRequestValue): void {
    this.store.requestPasswordChange(payload.targetUserId, { targetUserId: payload.targetUserId, reason: payload.reason }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'Solicitud enviada al superadmin', life: 3000 }); },
      error: () => { this.messages.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la solicitud.' }); }
    });
  }
  onCancelPasswordRequest(): void { this.store.closePasswordRequestModal(); }

  private statusLabel(status: UserStatus): string {
    if (status === 'active') return 'Activo'; if (status === 'suspended') return 'Suspendido'; if (status === 'invited') return 'Invitado'; return 'Eliminado';
  }
}
