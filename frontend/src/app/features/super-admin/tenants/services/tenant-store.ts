import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { TenantContext } from '../../../../@core/services/tenant/tenant-context';
import { Auth } from '../../../../@core/services/auth/auth';
import { ISelectList } from '../../../../@core/interfaces/i-select-list';
import { IChipItem } from '../../../../shared/chips/chip-list';
import {
	CreateTenantPayload,
	TenantFormValue,
	TenantListItemDTO,
	TenantQuery,
	UpdateTenantPayload,
} from '../interfaces/tenant';
import { TenantApi } from './tenant-api';

@Injectable({
	providedIn: 'root'
})
export class TenantStore {
	private readonly api = inject(TenantApi);
	private readonly router = inject(Router);
	private readonly tenantContext = inject(TenantContext);
	private readonly auth = inject(Auth);
	private readonly destroyRef = inject(DestroyRef);

	readonly loading = signal(false);
	readonly saving = signal(false);
	readonly modalOpen = signal(false);
	readonly selectedTenant = signal<TenantListItemDTO | null>(null);
	readonly tenants = signal<TenantListItemDTO[]>([]);
	readonly filters = signal<TenantQuery>({ search: '', status: '', page: 1, pageSize: 10 });
	readonly meta = signal({ page: 1, limit: 10, total: 0 });
	readonly statusOptions = signal<ISelectList[]>([
		{ name: 'Activo', code: 'active' },
		{ name: 'Suspendido', code: 'suspended' },
		{ name: 'Archivado', code: 'archived' },
	]);

	readonly summaryChips = computed<ReadonlyArray<IChipItem>>(() => {
		const list = this.tenants();
		const active = list.filter((tenant) => tenant.status === 'active').length;
		const suspended = list.filter((tenant) => tenant.status === 'suspended').length;
		const archived = list.filter((tenant) => tenant.status === 'archived').length;

		return [
			{ label: `Total: ${this.meta().total}`, icon: 'pi pi-building' },
			{ label: `Activos: ${active}`, icon: 'pi pi-check-circle' },
			{ label: `Suspendidos: ${suspended}`, icon: 'pi pi-exclamation-triangle' },
			{ label: `Archivados: ${archived}`, icon: 'pi pi-box' },
		];
	});

	constructor() {
		effect(() => {
			this.filters();
			this.load();
		});
	}

	load(): void {
		this.loading.set(true);

		this.api.list(this.filters())
			.pipe(
				finalize(() => this.loading.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: (response) => {
					this.tenants.set(response.data);
					this.meta.set(response.meta);
				},
				error: () => {
					this.tenants.set([]);
					this.meta.set({ page: 1, limit: 10, total: 0 });
				},
				complete: () => undefined,
			});
	}

	setSearch(search: string): void {
		this.filters.update((prev) => ({ ...prev, search, page: 1 }));
	}

	setStatus(status: '' | 'active' | 'suspended' | 'archived'): void {
		this.filters.update((prev) => ({ ...prev, status, page: 1 }));
	}

	resetFilters(): void {
		this.filters.set({ search: '', status: '', page: 1, pageSize: 10 });
	}

	selectTenant(tenantId: string): void {
		this.tenantContext.setActiveTenantId(tenantId);

		if (this.auth.currentUser()?.role === 'super-admin') {
			this.router.navigate(['/admin', tenantId, 'dashboard']);
			return;
		}

		this.router.navigate(['/', tenantId, 'dashboard']);
	}

	openCreate(): void {
		this.selectedTenant.set(null);
		this.modalOpen.set(true);
	}

	openEdit(tenantId: string): void {
		const tenant = this.tenants().find((item) => item.id === tenantId) ?? null;
		this.selectedTenant.set(tenant);
		this.modalOpen.set(true);
	}

	closeModal(): void {
		this.modalOpen.set(false);
	}

	saveTenant(value: TenantFormValue): Observable<TenantListItemDTO> {
		this.saving.set(true);
		const isEdit = Boolean(value.id);

		const request$ = isEdit && value.id
			? this.api.update(value.id, this.toUpdatePayload(value))
			: this.api.create(this.toCreatePayload(value));

		return request$.pipe(
			map((tenant) => tenant),
			tap((tenant) => this.upsertTenant(tenant)),
			tap(() => this.modalOpen.set(false)),
			finalize(() => this.saving.set(false)),
			takeUntilDestroyed(this.destroyRef)
		);
	}

	private toCreatePayload(value: TenantFormValue): CreateTenantPayload {
		return {
			slug: value.slug.trim().toLowerCase(),
			name: value.name.trim(),
			documentType: value.documentType.trim(),
			documentNumber: value.documentNumber.trim(),
			status: value.status,
		};
	}

	private toUpdatePayload(value: TenantFormValue): UpdateTenantPayload {
		return {
			name: value.name.trim(),
			status: value.status,
		};
	}

	private upsertTenant(tenant: TenantListItemDTO): void {
		this.tenants.update((current) => {
			const index = current.findIndex((item) => item.id === tenant.id);
			if (index === -1) {
				this.meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
				return [tenant, ...current];
			}

			const clone = [...current];
			clone[index] = { ...clone[index], ...tenant };
			return clone;
		});
	}
}
