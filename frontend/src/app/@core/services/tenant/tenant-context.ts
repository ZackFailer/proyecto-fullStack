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
		const next = cleanValue && cleanValue.length > 0 ? cleanValue : null;
		const current = this.tenantId();

		if (current !== next) {
			this.tenantId.set(next);
			this.tenantInfo.set(null);
		}
	}

  setTenantInfo(value: { id: string; name: string } | null): void {
    this.tenantInfo.set(value);
  }

	clear(): void {
		this.tenantId.set(null);
		this.tenantInfo.set(null);
	}
}
