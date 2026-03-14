import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChipList } from '../../../../../shared/chips/chip-list';
import { HomeHeroHeader, IHeroHeaderConfig } from '../../../../../shared/hero-header/hero-header';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TenantFilters } from '../../components/tenant-filters/tenant-filters';
import { TenantTable } from '../../components/tenant-table/tenant-table';
import { TenantFormValue } from '../../interfaces/tenant';
import { TenantStore } from '../../services/tenant-store';
import { TenantModal } from '../../components/tenant-modal/tenant-modal';
import { routes } from '../../../../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tenants-page',
  imports: [ToastModule, HomeHeroHeader, ChipList, TenantFilters, TenantTable, TenantModal],
  template: `
    <section class="grid gap-4">
      <p-toast position="top-right" />

      <app-home-hero-header [config]="heroConfig()" />

      <app-chip-list [chips]="summaryChips()" />

      <app-tenant-filters
        [filters]="filters()"
        [statusOptions]="statusOptions()"
        (searchChanged)="onSearch($event)"
        (statusChanged)="onStatusChange($event)"
        (createRequested)="onCreateTenant()"
        (refreshRequested)="refresh()"
        (clearRequested)="onClearFilters()"
      />

      <app-tenant-table
        [tenants]="tenants()"
        (editTenant)="onEditTenant($event)"
        (openTenant)="onOpenTenant($event)"
      />

      <app-tenant-modal
        [visible]="modalOpen()"
        [tenant]="selectedTenant()"
        [saving]="saving()"
        [statusOptions]="statusOptions()"
        (submitted)="onSubmitTenant($event)"
        (canceled)="onCancelModal()"
      />
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TenantsPage {
  private readonly store = inject(TenantStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly heroConfig = computed<IHeroHeaderConfig>(() => ({
    title: 'Administracion',
    subTitle: 'Selecciona y gestiona tenants con contexto multi-tenant',
    route: [],
  }));

  protected readonly filters = this.store.filters;
  protected readonly tenants = this.store.tenants;
  protected readonly statusOptions = this.store.statusOptions;
  protected readonly summaryChips = this.store.summaryChips;
  protected readonly modalOpen = this.store.modalOpen;
  protected readonly selectedTenant = this.store.selectedTenant;
  protected readonly saving = this.store.saving;

  protected onSearch(term: string): void {
    this.store.setSearch(term);
  }

  protected onStatusChange(value: '' | 'active' | 'suspended' | 'archived'): void {
    this.store.setStatus(value);
  }

  protected refresh(): void {
    this.store.load();
  }

  protected onClearFilters(): void {
    this.store.resetFilters();
  }

  protected onCreateTenant(): void {
    this.store.openCreate();
  }

  protected onEditTenant(tenantId: string): void {
    this.store.openEdit(tenantId);
  }

  protected onCancelModal(): void {
    this.store.closeModal();
  }

  protected onSubmitTenant(payload: TenantFormValue): void {
    const isEdit = Boolean(payload.id);
    this.store
      .saveTenant(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tenant) => {
          this.messages.add({
            severity: 'success',
            summary: isEdit ? 'Tenant actualizado' : 'Tenant creado',
            detail: tenant.name,
            life: 2500,
          });
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el tenant',
            life: 3000,
          });
        },
        complete: () => undefined,
      });
  }

  protected onOpenTenant(tenantId: string): void {
    // Aquí iría la lógica para cambiar al contexto del tenant seleccionado
    this.store.selectTenant(tenantId);
  }
}
