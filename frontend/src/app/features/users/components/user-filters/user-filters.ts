import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { UserRole, UserStatus } from '../../interfaces/user';

interface FilterState {
  search: string;
  role: UserRole | '';
  status: UserStatus | '';
}

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-user-filters',
  imports: [CardModule, IconFieldModule, InputIconModule, InputText, SelectModule, FormsModule, ButtonModule],
  template: `
    <p-card styleClass="shadow-1 border border-surface-200" header="Usuarios">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.28em] text-emerald-700">Control centralizado</p>
          <p class="text-lg font-semibold text-surface-900">Gestiona usuarios, roles y estados</p>
          <p class="text-sm text-surface-600">Filtra por rol, estado o busca por nombre y correo. Las acciones se mantienen en la misma vista.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <p-button type="button" label="Crear usuario" icon="pi pi-plus" styleClass="p-button-success" (onClick)="createRequested.emit()" />
          <p-button type="button" label="Refrescar" icon="pi pi-refresh" styleClass="p-button-text" (onClick)="refreshRequested.emit()" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 pt-4 md:grid-cols-4" aria-label="Filtros de usuarios">
        <p-iconfield class="w-full">
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            type="text"
            class="w-full"
            [ngModel]="filters().search"
            (ngModelChange)="searchChanged.emit($event)"
            placeholder="Buscar por nombre o email"
            aria-label="Buscar usuarios"
          />
        </p-iconfield>

        <p-select
          class="w-full"
          [options]="roleOptions()"
          [ngModel]="filters().role"
          (ngModelChange)="roleChanged.emit($event)"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          placeholder="Filtrar por rol"
          inputId="role-select"
        />

        <p-select
          class="w-full"
          [options]="statusOptions()"
          [ngModel]="filters().status"
          (ngModelChange)="statusChanged.emit($event)"
          optionLabel="label"
          optionValue="value"
          [showClear]="true"
          placeholder="Filtrar por estado"
          inputId="status-select"
        />
        <div class="flex items-center md:justify-end">
          <p-button
            type="button"
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            styleClass="p-button-text"
            (onClick)="clearRequested.emit()"
            aria-label="Limpiar filtros"
          />
        </div>

      </div>
      <!-- <div class="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-3 text-sm text-surface-600">
        <p class="font-semibold text-surface-800">Consejo rápido</p>
        <p class="mt-1 leading-relaxed">Mantén roles acotados a admin/manager/viewer y usa estados para suspender temporalmente sin perder el historial.</p>
      </div> -->
    </p-card>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFilters {
  readonly filters = input.required<FilterState>();
  readonly roleOptions = input.required<Option<UserRole>[]>();
  readonly statusOptions = input.required<Option<UserStatus>[]>();

  readonly searchChanged = output<string>();
  readonly roleChanged = output<UserRole | ''>();
  readonly statusChanged = output<UserStatus | ''>();
  readonly createRequested = output<void>();
  readonly refreshRequested = output<void>();
  readonly clearRequested = output<void>();
}
