import { computed, Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class TenantContext {
	private readonly tenantId = signal<string | null>(null);

	readonly activeTenantId = computed(() => this.tenantId());

  tenantInfo = signal<{ id: string; name: string } | null>(null);

	setActiveTenantId(value: string | null): void {
		const cleanValue = value?.trim() ?? null;
		this.tenantId.set(cleanValue && cleanValue.length > 0 ? cleanValue : null);
    console.log('se cambio el tenantId:', this.tenantId());
    
	}

	clear(): void {
		this.tenantId.set(null);
		this.tenantInfo.set(null);
	}
}
