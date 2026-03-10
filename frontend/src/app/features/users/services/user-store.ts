import { DestroyRef, computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, tap, Observable } from 'rxjs';
import { UserApi } from './user-api';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserDTO,
  UserMeta,
  UserQuery,
  UserRole,
  UserStatus,
} from '../interfaces/user';

export interface UserFormValue extends CreateUserPayload {
  id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly api = inject(UserApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly users = signal<UserDTO[]>([]);
  readonly meta = signal<UserMeta>({ page: 1, pageSize: 10, total: 0 });
  readonly filters = signal<UserQuery>({ search: '', role: '', status: '', page: 1, pageSize: 10 });
  readonly selectedUser = signal<UserDTO | null>(null);

  readonly roleOptions = computed(() => ([
    { label: 'Admin', value: 'admin' as UserRole },
    { label: 'Manager', value: 'manager' as UserRole },
    { label: 'Viewer', value: 'viewer' as UserRole },
  ]));

  readonly statusOptions = computed(() => ([
    { label: 'Activo', value: 'active' as UserStatus },
    { label: 'Suspendido', value: 'suspended' as UserStatus },
    { label: 'Pendiente', value: 'pending_invite' as UserStatus },
  ]));

  readonly tableUsers = computed(() =>
    this.users().map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    }))
  );

  readonly stats = computed(() => {
    const list = this.users();
    const active = list.filter(user => user.status === 'active').length;
    const suspended = list.filter(user => user.status === 'suspended').length;
    const pending = list.filter(user => user.status === 'pending_invite').length;
    return {
      total: this.meta().total,
      active,
      suspended,
      pending,
    };
  });

  constructor() {
    effect(() => {
      // Automatically refresh when filters change
      this.filters();
      this.load();
    }, { allowSignalWrites: true });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list(this.filters())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe(response => {
        this.users.set(response.data);
        if (response.meta) {
          this.meta.set(response.meta);
        }
      });
  }

  setSearch(search: string): void {
    this.filters.update(prev => ({ ...prev, search, page: 1 }));
  }

  setRole(role: UserRole | ''): void {
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
    this.filters.set({ search: '', role: '', status: '', page: 1, pageSize: 10 });
  }

  openCreate(): void {
    this.selectedUser.set(null);
    this.modalOpen.set(true);
  }

  openEdit(user: UserDTO): void {
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
    const request$ = isEdit && value.id
      ? this.api.update(value.id, payload as UpdateUserPayload)
      : this.api.create(payload as CreateUserPayload);

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
    return this.api.changeStatus(user.id, nextStatus).pipe(
      map(res => res.data),
      tap(updated => this.upsertUser(updated)),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private toPayload(value: UserFormValue, isEdit: boolean): CreateUserPayload | UpdateUserPayload {
    if (isEdit) {
      const body: UpdateUserPayload = {
        firstName: value.firstName,
        lastName: value.lastName,
        role: value.role,
        status: value.status,
        phone: value.phone ?? undefined,
        avatarUrl: value.avatarUrl ?? undefined,
      };
      return body;
    }

    const payload: CreateUserPayload = {
      email: value.email,
      firstName: value.firstName,
      lastName: value.lastName,
      role: value.role,
      status: value.status ?? 'active',
      phone: value.phone ?? undefined,
      avatarUrl: value.avatarUrl ?? undefined,
    };

    if (value.password) {
      payload.password = value.password;
    }

    return payload;
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
