import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { UserDTO, UserMeta, UserStatus } from '../../interfaces/user';

@Component({
  selector: 'app-user-table',
  imports: [TableModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, DatePipe],
  template: `
    <div class="rounded-2xl border border-surface-200 bg-surface-0 shadow-1">
      <div class="flex items-center justify-between gap-2 px-4 py-3">
        <div class="space-y-1">
          <p class="text-sm font-semibold text-surface-900">Usuarios</p>
          <p class="text-xs text-surface-600">Listado paginado con acciones en línea</p>
        </div>
        @if (meta().total >= 0) {
          <p-tag severity="info" [value]="meta().total + ' totales'"></p-tag>
        }
      </div>

      <p-table
        [value]="users()"
        [paginator]="true"
        [rows]="meta().pageSize"
        [totalRecords]="meta().total"
        [first]="(meta().page - 1) * meta().pageSize"
        [rowsPerPageOptions]="pageSizeOptions()"
        [loading]="loading()"
        dataKey="id"
        responsiveLayout="scroll"
        (onPage)="onPageChange($event)"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Último acceso</th>
            <th>Creado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-user>
          <tr>
            <td>
              <div class="flex items-center gap-3">
                <p-avatar
                  [label]="user.fullName ? user.fullName.slice(0, 1).toUpperCase() : '?'"
                  [shape]="'circle'"
                  size="normal"
                  styleClass="bg-primary-50 text-primary-600"
                ></p-avatar>
                <div class="space-y-1">
                  <p class="font-medium text-surface-900">{{ user.fullName }}</p>
                  <p class="text-xs text-surface-600">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <p-tag severity="secondary" [value]="user.role"></p-tag>
            </td>
            <td>
              <p-tag [severity]="statusSeverity(user.status)" [value]="statusLabel(user.status)"></p-tag>
            </td>
            <td>
              <span class="text-sm text-surface-700">
                {{ user.lastLoginAt ? (user.lastLoginAt | date: 'medium') : 'Sin registro' }}
              </span>
            </td>
            <td>
              <span class="text-sm text-surface-700">{{ user.createdAt | date: 'mediumDate' }}</span>
            </td>
            <td class="text-center">
              <div class="flex items-center justify-center gap-2">
                <p-button
                  size="small"
                  icon="pi pi-pencil"
                  styleClass="p-button-rounded p-button-text"
                  (onClick)="edit.emit(user)"
                  aria-label="Editar usuario"
                ></p-button>
                <p-button
                  size="small"
                  [icon]="user.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                  [severity]="user.status === 'active' ? 'danger' : 'success'"
                  styleClass="p-button-rounded"
                  (onClick)="toggleStatus.emit(user)"
                  [ariaLabel]="user.status === 'active' ? 'Suspender' : 'Reactivar'"
                ></p-button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="py-10 text-center text-sm text-surface-600">
              No se encontraron usuarios con los filtros seleccionados.
            </td>
          </tr>
        </ng-template>
      </p-table>

      @if (loading()) {
        <div class="space-y-2 p-4" aria-hidden="true">
          @for (item of [1,2,3]; track item) {
            <p-skeleton height="2.5rem" borderRadius="0.75rem"></p-skeleton>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTable {
  readonly users = input.required<(UserDTO & { fullName: string })[]>();
  readonly meta = input.required<UserMeta>();
  readonly loading = input<boolean>(false);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);

  readonly edit = output<UserDTO>();
  readonly toggleStatus = output<UserDTO>();
  readonly pageChange = output<{ page: number; pageSize: number }>();

  statusSeverity(status: UserStatus) {
    if (status === 'active') return 'success';
    if (status === 'suspended') return 'danger';
    if (status === 'invited') return 'warn';
    return 'warn';
  }

  statusLabel(status: UserStatus): string {
    if (status === 'active') return 'Activo';
    if (status === 'suspended') return 'Suspendido';
    if (status === 'invited') return 'Invitado';
    return 'Eliminado';
  }

  onPageChange(event: TablePageEvent) {
    const nextPage = (event.first ?? 0) / (event.rows ?? this.meta().pageSize) + 1;
    const pageSize = event.rows ?? this.meta().pageSize;
    this.pageChange.emit({ page: nextPage, pageSize });
  }
}
