export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface TenantBranding {
	logoUrl?: string;
	primaryColor?: string;
	secondaryColor?: string;
}

export interface TenantListItemDTO {
	id: string;
	slug: string;
	name: string;
	legalName?: string;
	documentType?: string;
	documentNumber: string;
	email?: string;
	phone?: string;
	address?: string;
	timezone?: string;
	currency?: string;
	status: TenantStatus;
	branding?: TenantBranding;
	settings?: {
		currency?: string;
		branding?: TenantBranding;
	};
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
	legalName?: string;
	documentType: string;
	documentNumber: string;
	email?: string;
	phone?: string;
	address?: string;
	status?: TenantStatus;
	settings?: {
		currency?: string;
		branding?: TenantBranding;
	};
}

export interface UpdateTenantPayload {
	name?: string;
	legalName?: string;
	email?: string;
	phone?: string;
	address?: string;
	status?: TenantStatus;
	settings?: {
		currency?: string;
		branding?: TenantBranding;
	};
}

export interface TenantFormValue {
	id?: string;
	slug: string;
	name: string;
	legalName: string;
	documentType: string;
	documentNumber: string;
	email: string;
	phone: string;
	address: string;
	timezone: string;
	currency: string;
	status: TenantStatus;
	brandingLogoUrl: string;
	brandingPrimaryColor: string;
	brandingSecondaryColor: string;
}
