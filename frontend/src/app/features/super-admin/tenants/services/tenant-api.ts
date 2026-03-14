import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
	BackendEnvelope,
	CreateTenantPayload,
	PagedMeta,
	TenantListItemDTO,
	TenantListResponse,
	TenantQuery,
	UpdateTenantPayload,
} from '../interfaces/tenant';

@Injectable({
	providedIn: 'root'
})
export class TenantApi {
	private readonly http = inject(HttpClient);
	private readonly apiUrl = '/api/tenants';

	private readonly mockTenants: TenantListItemDTO[] = [
		{
			id: 't-1001',
			slug: 'acme-colombia',
			name: 'Acme Colombia',
			documentType: 'NIT',
			documentNumber: '900123111',
			status: 'active',
			createdAt: '2025-02-01T00:00:00.000Z',
			updatedAt: '2026-01-05T00:00:00.000Z',
		},
		{
			id: 't-1002',
			slug: 'nova-logistics',
			name: 'Nova Logistics',
			documentType: 'NIT',
			documentNumber: '901334222',
			status: 'suspended',
			createdAt: '2025-04-14T00:00:00.000Z',
			updatedAt: '2026-02-18T00:00:00.000Z',
		},
		{
			id: 't-1003',
			slug: 'cafe-andes',
			name: 'Cafe Andes',
			documentType: 'NIT',
			documentNumber: '890001123',
			status: 'active',
			createdAt: '2025-05-20T00:00:00.000Z',
			updatedAt: '2026-03-01T00:00:00.000Z',
		},
	];

	list(query: TenantQuery): Observable<TenantListResponse> {
		const params = this.buildParams(query);

		return this.http
			.get<BackendEnvelope<TenantListItemDTO[]>>(this.apiUrl, { params })
			.pipe(
				map((response) => this.normalizeListResponse(response, query.pageSize ?? 10)),
				catchError(() => this.mockList(query))
			);
	}

	create(payload: CreateTenantPayload): Observable<TenantListItemDTO> {
		return this.http
			.post<BackendEnvelope<TenantListItemDTO>>(this.apiUrl, payload)
			.pipe(
				map((response) => this.normalizeTenant(response.data)),
				catchError(() => this.mockCreate(payload))
			);
	}

	update(id: string, payload: UpdateTenantPayload): Observable<TenantListItemDTO> {
		return this.http
			.patch<BackendEnvelope<TenantListItemDTO>>(`${this.apiUrl}/${id}`, payload)
			.pipe(
				map((response) => this.normalizeTenant(response.data)),
				catchError(() => this.mockUpdate(id, payload))
			);
	}

	private buildParams(query: TenantQuery): HttpParams {
		return new HttpParams({
			fromObject: {
				...(query.search ? { search: query.search } : {}),
				...(query.status ? { status: query.status } : {}),
				page: String(query.page ?? 1),
				limit: String(query.pageSize ?? 10),
			}
		});
	}

	private normalizeListResponse(response: BackendEnvelope<TenantListItemDTO[]>, fallbackLimit: number): TenantListResponse {
		const data = (response.data ?? []).map((item) => this.normalizeTenant(item));
		const meta: PagedMeta = {
			page: response.meta?.page ?? 1,
			limit: response.meta?.limit ?? fallbackLimit,
			total: response.meta?.total ?? data.length,
		};

		return { data, meta };
	}

	private normalizeTenant(item: TenantListItemDTO): TenantListItemDTO {
		return {
			...item,
			id: item.id,
			slug: item.slug,
			name: item.name,
			documentType: item.documentType,
			documentNumber: item.documentNumber,
			status: item.status,
		};
	}

	private mockList(query: TenantQuery): Observable<TenantListResponse> {
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? 10;
		const searchTerm = (query.search ?? '').trim().toLowerCase();
		const statusFilter = query.status ?? '';

		const filtered = this.mockTenants.filter((tenant) => {
			const matchesSearch = searchTerm
				? tenant.name.toLowerCase().includes(searchTerm) ||
					tenant.slug.toLowerCase().includes(searchTerm) ||
					tenant.documentNumber.includes(searchTerm)
				: true;

			const matchesStatus = statusFilter ? tenant.status === statusFilter : true;
			return matchesSearch && matchesStatus;
		});

		const start = (page - 1) * pageSize;
		const data = filtered.slice(start, start + pageSize);

		return of({
			data,
			meta: {
				page,
				limit: pageSize,
				total: filtered.length,
			},
		});
	}

	private mockCreate(payload: CreateTenantPayload): Observable<TenantListItemDTO> {
		const now = new Date().toISOString();
		const tenant: TenantListItemDTO = {
			id: `t-${Date.now()}`,
			slug: payload.slug,
			name: payload.name,
			documentType: payload.documentType,
			documentNumber: payload.documentNumber,
			status: payload.status ?? 'active',
			createdAt: now,
			updatedAt: now,
		};

		this.mockTenants.unshift(tenant);
		return of(tenant);
	}

	private mockUpdate(id: string, payload: UpdateTenantPayload): Observable<TenantListItemDTO> {
		const index = this.mockTenants.findIndex((tenant) => tenant.id === id);
		if (index === -1) {
			return of(this.mockTenants[0]);
		}

		const updated: TenantListItemDTO = {
			...this.mockTenants[index],
			...payload,
			updatedAt: new Date().toISOString(),
		};

		this.mockTenants[index] = updated;
		return of(updated);
	}
}
