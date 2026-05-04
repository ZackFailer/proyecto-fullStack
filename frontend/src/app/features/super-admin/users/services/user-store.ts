import { DestroyRef, computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, tap, Observable } from 'rxjs';
import { UserApi } from './user-api';
import { Auth } from '../../../../@core/services/auth/auth';
import {
  CreateUserPayload,
  PasswordChangeRequestDTO,
  PasswordChangeRequestPayload,
  UpdateUserPayload,
  UserDTO,
  UserMeta,
  UserQuery,
  UserRole,
  UserStatus,
} from '../interfaces/user';

export interface UserFormValue {
  id?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string | null;
  locale?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly api = inject(UserApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(Auth);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly privilegedPasswordModalOpen = signal(false);
  readonly passwordRequestModalOpen = signal(false);
  readonly users = signal<UserDTO[]>([]);
  readonly meta = signal<UserMeta>({ page: 1, pageSize: 10, total: 0 });
  readonly filters = signal<UserQuery>({ search: '', role: '', status: '', page: 1, pageSize: 10 });
  readonly selectedUser = signal<UserDTO | null>(null);
  readonly scopedTenantId = signal<string | null>(null);

  readonly isGlobalScope = computed(() => !this.scopedTenantId());
  readonly isTenantScope = computed(() => Boolean(this.scopedTenantId()));
  readonly isSuperAdminTenantView = computed(() => this.isTenantScope() && this.auth.isSuperAdmin());
  readonly canMutate = computed(() => {
    if (this.isGlobalScope()) return this.auth.isSuperAdmin();
    if (this.isSuperAdminTenantView()) return true;
    return this.auth.currentUser()?.role === 'admin';
  });
readonly showRoleFilter = computed(() => !this.isGlobalScope());
  readonly showCreate = computed(() => this.canMutate());
  readonly showActions = computed(() => this.canMutate());
  readonly currentUserRole = computed(() => this.auth.currentUser()?.role ?? 'admin');

  readonly roleOptions = computed(() => {
    if (this.isGlobalScope()) {
      return [{ label: 'Super Admin', value: 'super-admin' as UserRole }];
    }

    return [
      { label: 'Admin', value: 'admin' as UserRole },
      { label: 'Operador', value: 'operator' as UserRole },
      { label: 'Viewer', value: 'viewer' as UserRole },
    ];
  });

  readonly statusOptions = computed(() => ([
    { label: 'Activo', value: 'active' as UserStatus },
    { label: 'Suspendido', value: 'suspended' as UserStatus },
    { label: 'Invitado', value: 'invited' as UserStatus },
    { label: 'Eliminado', value: 'deleted' as UserStatus },
  ]));

  readonly tableUsers = computed(() =>
    this.users().map(user => ({
      ...user
    }))
  );

  readonly stats = computed(() => {
    const list = this.users();
    const active = list.filter(user => user.status === 'active').length;
    const suspended = list.filter(user => user.status === 'suspended').length;
    const pending = list.filter(user => user.status === 'invited').length;
    return {
      total: this.meta().total,
      active,
      suspended,
      pending,
    };
  });

  constructor() {
    this.filters.update((prev) => ({
      ...prev,
      role: this.isGlobalScope() ? 'super-admin' : prev.role,
    }));

    effect(() => {
      // Automatically refresh when filters change
      this.filters();
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list(this.filters(), {
        tenantId: this.scopedTenantId(),
        globalSuperAdminOnly: this.isGlobalScope(),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.users.set(response.data);

          if (response.meta) {
            this.meta.set(response.meta);
          }
        },
        error: () => {
          this.users.set([]);
        },
        complete: () => undefined,
      });
  }

  setSearch(search: string): void {
    this.filters.update(prev => ({ ...prev, search, page: 1 }));
  }

  setRole(role: UserRole | ''): void {
    if (this.isGlobalScope()) {
      return;
    }

    this.filters.update(prev => ({ ...prev, role, page: 1 }));
  }

  setStatus(status: UserStatus | ''): void {
    this.filters.update(prev => ({ ...prev, status, page: 1 }));
  }

  setPage(page: number, pageSize?: number): void {
    this.filters.update(prev => ({
      ...prev,
      page,
      pageSize: pageSize ?? prev.pageSize,
    }));
  }

  resetFilters(): void {
    this.filters.set({
      search: '',
      role: this.isGlobalScope() ? 'super-admin' : '',
      status: '',
      page: 1,
      pageSize: 10,
    });
  }

  setScope(tenantId: string | null): void {
    this.scopedTenantId.set(tenantId);

    this.filters.update((prev) => ({
      ...prev,
      role: tenantId ? '' : 'super-admin',
      page: 1,
    }));
  }

  openCreate(): void {
    if (!this.canMutate()) return;
    this.selectedUser.set(null);
    this.modalOpen.set(true);
  }

  openEdit(user: UserDTO): void {
    if (!this.canMutate()) return;
    this.selectedUser.set(user);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveUser(value: UserFormValue): Observable<UserDTO> {
    this.saving.set(true);
    const isEdit = Boolean(value.id);
    const payload = this.toPayload(value, isEdit);
    const tenantId = this.scopedTenantId();
    const request$ = isEdit && value.id
      ? this.api.update(value.id, payload as UpdateUserPayload, tenantId)
      : this.api.create(payload as CreateUserPayload, tenantId);

    return request$
      .pipe(
        map(res => res.data),
        tap(user => {
          if (isEdit) {
            this.upsertUser(user);
          } else {
            this.users.update(current => [user, ...current]);
            this.meta.update(meta => ({ ...meta, total: meta.total + 1 }));
          }
          this.modalOpen.set(false);
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      );
  }

  toggleStatus(user: UserDTO): Observable<UserDTO> {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    this.saving.set(true);
    return this.api.changeStatus(user.id, nextStatus, this.scopedTenantId()).pipe(
      map(res => res.data),
      tap(updated => this.upsertUser(updated)),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  openPrivilegedPasswordChange(user: UserDTO): void {
    if (!this.canMutate()) return;
    this.selectedUser.set(user);
    this.privilegedPasswordModalOpen.set(true);
  }

  closePrivilegedPasswordModal(): void {
    this.privilegedPasswordModalOpen.set(false);
  }

  changePasswordPrivileged(
    userId: string,
    payload: { adminPassword?: string; newPassword: string }
  ): Observable<UserDTO> {
    this.saving.set(true);
    const tenantId = this.scopedTenantId();

    return this.api.privilegedChangePassword(userId, payload, tenantId).pipe(
      map(res => res.data),
      tap(() => {
        this.privilegedPasswordModalOpen.set(false);
      }),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  openPasswordRequestModal(user: UserDTO): void {
    this.selectedUser.set(user);
    this.passwordRequestModalOpen.set(true);
  }

  closePasswordRequestModal(): void {
    this.passwordRequestModalOpen.set(false);
  }

  requestPasswordChange(
    targetUserId: string,
    payload: PasswordChangeRequestPayload
  ): Observable<PasswordChangeRequestDTO> {
    this.saving.set(true);
    const tenantId = this.scopedTenantId();

    return this.api.addPasswordChangeRequest({ targetUserId, reason: payload.reason }, tenantId).pipe(
      map(res => res.data),
      tap(() => {
        this.passwordRequestModalOpen.set(false);
      }),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private toPayload(value: UserFormValue, isEdit: boolean): CreateUserPayload | UpdateUserPayload {
    if (isEdit) {
      const body: UpdateUserPayload = {
        fullName: `${value.firstName} ${value.lastName}`.trim(),
        role: this.normalizeRole(value.role),
        status: value.status,
        phone: value.phone ?? undefined,
        locale: value.locale ?? undefined,
      };
      return body;
    }

    const payload: CreateUserPayload = {
      email: value.email,
      fullName: `${value.firstName} ${value.lastName}`.trim(),
      role: this.normalizeRole(value.role),
      status: value.status ?? 'active',
      phone: value.phone ?? undefined,
      locale: value.locale ?? undefined,
    };

    if (value.password) {
      payload.password = value.password;
    }

    return payload;
  }

  private normalizeRole(role: UserRole): UserRole {
    if (this.isGlobalScope()) {
      return 'super-admin';
    }

    if (role === 'super-admin') {
      return 'viewer';
    }

    return role;
  }

  private upsertUser(user: UserDTO): void {
    this.users.update(current => {
      const index = current.findIndex(item => item.id === user.id);
      if (index === -1) {
        return [user, ...current];
      }
      const clone = [...current];
      clone[index] = user;
      return clone;
    });
  }
}
