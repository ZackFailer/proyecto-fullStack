import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { LoginAttemptDTO, LoginAttemptFilters } from '../../interfaces/login-attempt';
import { LoginAttemptsApi } from '../../services/login-attempts-api';

@Component({
  selector: 'app-login-attempts-page',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    TagModule,
  ],
  template: `
    <section class="grid gap-4">
      <p-card styleClass="shadow-1 border border-surface-200" header="Intentos de login">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            pInputText
            type="text"
            class="w-full"
            [(ngModel)]="filters().email"
            placeholder="Filtrar por email"
            aria-label="Filtrar por email"
          />

          <p-select
            class="w-full"
            [options]="successOptions"
            [ngModel]="filters().success"
            (ngModelChange)="onSuccessChange($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado"
          />

          <p-select
            class="w-full"
            [options]="limitOptions"
            [ngModel]="filters().limit"
            (ngModelChange)="onLimitChange($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="Límite"
          />

          <div class="flex items-center justify-end gap-2">
            <p-button label="Aplicar" icon="pi pi-filter" (onClick)="load()" />
            <p-button label="Limpiar" icon="pi pi-filter-slash" styleClass="p-button-text" (onClick)="resetFilters()" />
          </div>
        </div>
      </p-card>

      <div class="rounded-2xl border border-surface-200 bg-surface-0 shadow-1">
        <div class="flex items-center justify-between px-4 py-3">
          <p class="text-sm font-semibold text-surface-900">Resultados</p>
          <p-tag severity="info" [value]="total() + ' registros'"></p-tag>
        </div>

        <p-table [value]="items()" [loading]="loading()" responsiveLayout="scroll" dataKey="id">
          <ng-template pTemplate="header">
            <tr>
              <th>Email</th>
              <th>Resultado</th>
              <th>Razón</th>
              <th>IP</th>
              <th>User Agent</th>
              <th>Fecha</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-item>
            <tr>
              <td>{{ item.email }}</td>
              <td>
                <p-tag [severity]="item.success ? 'success' : 'danger'" [value]="item.success ? 'Éxito' : 'Fallo'"></p-tag>
              </td>
              <td>{{ item.reason }}</td>
              <td>{{ item.ip ?? 'N/A' }}</td>
              <td class="max-w-sm truncate">{{ item.userAgent ?? 'N/A' }}</td>
              <td>{{ item.createdAt | date: 'medium' }}</td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="py-10 text-center text-sm text-surface-600">
                No hay intentos de login para los filtros seleccionados.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginAttemptsPage {
  private readonly api = inject(LoginAttemptsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly items = signal<LoginAttemptDTO[]>([]);
  readonly total = signal(0);
  readonly filters = signal<LoginAttemptFilters>({
    email: '',
    success: '',
    limit: 50,
  });

  readonly successOptions = [
    { label: 'Todos', value: '' as const },
    { label: 'Éxito', value: 'true' as const },
    { label: 'Fallo', value: 'false' as const },
  ];

  readonly limitOptions = [
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
  ];

  constructor() {
    this.load();
  }

  onSuccessChange(value: '' | 'true' | 'false'): void {
    this.filters.update((prev) => ({ ...prev, success: value }));
  }

  onLimitChange(value: number): void {
    this.filters.update((prev) => ({ ...prev, limit: value }));
  }

  resetFilters(): void {
    this.filters.set({ email: '', success: '', limit: 50 });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list(this.filters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.total.set(result.total);
        },
        error: () => {
          this.items.set([]);
          this.total.set(0);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }
}
