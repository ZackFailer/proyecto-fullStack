export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface TenantListItemDTO {
	id: string;
	slug: string;
	name: string;
	documentType?: string;
	documentNumber: string;
	status: TenantStatus;
	createdAt?: string;
	updatedAt?: string;
}

export interface PagedMeta {
	page: number;
	limit: number;
	total: number;
}

export interface BackendEnvelope<T> {
	success: boolean;
	message: string;
	data: T;
	meta?: PagedMeta;
}

export interface TenantQuery {
	search?: string;
	status?: TenantStatus | '';
	page?: number;
	pageSize?: number;
}

export interface TenantListResponse {
	data: TenantListItemDTO[];
	meta: PagedMeta;
}

export interface CreateTenantPayload {
	slug: string;
	name: string;
	documentType: string;
	documentNumber: string;
	status?: TenantStatus;
}

export interface UpdateTenantPayload {
	name?: string;
	status?: TenantStatus;
}

export interface TenantFormValue {
	id?: string;
	slug: string;
	name: string;
	documentType: string;
	documentNumber: string;
	status: TenantStatus;
}
