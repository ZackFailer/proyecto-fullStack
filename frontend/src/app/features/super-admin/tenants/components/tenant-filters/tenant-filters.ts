import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ISelectList } from '../../../../../@core/interfaces/i-select-list';
import { TenantQuery } from '../../interfaces/tenant';

@Component({
	selector: 'app-tenant-filters',
	imports: [FormsModule, ButtonModule, InputTextModule, SelectModule],
	template: `
		<div class="tenant-filter-card">
			<div class="grid gap-3 lg:grid-cols-3">
				<div class="grid gap-2">
					<label for="tenant-search">Buscar</label>
					<input
						id="tenant-search"
						pInputText
						type="text"
						[ngModel]="filters().search ?? ''"
						(ngModelChange)="searchChanged.emit($event)"
						placeholder="Nombre, slug o documento"
					/>
				</div>

				<div class="grid gap-2">
					<label for="tenant-status">Estado</label>
					<p-select
						inputId="tenant-status"
						[options]="statusOptions()"
						optionLabel="name"
						optionValue="code"
						[ngModel]="filters().status ?? null"
						(ngModelChange)="onStatusChange($event)"
						placeholder="Todos"
						[showClear]="true"
					/>
				</div>
			</div>

			<div class="mt-3 flex flex-wrap gap-2 justify-end">
				<p-button label="Nuevo tenant" icon="pi pi-plus" styleClass="p-button-sm" (onClick)="createRequested.emit()" />
				<p-button label="Refrescar" icon="pi pi-refresh" styleClass="p-button-sm p-button-outlined" (onClick)="refreshRequested.emit()" />
				<p-button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" styleClass="p-button-sm" (onClick)="clearRequested.emit()" />
			</div>
		</div>
	`,
	styles: `
		:host {
			display: block;
		}

		.tenant-filter-card {
			border: 1px solid var(--surface-border);
			border-radius: 1rem;
			background: var(--surface-card);
			padding: 1rem;
		}

		label {
			font-size: 0.85rem;
			color: var(--text-color-secondary);
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantFilters {
	readonly filters = input.required<TenantQuery>();
	readonly statusOptions = input.required<ISelectList[]>();

	readonly searchChanged = output<string>();
	readonly statusChanged = output<'' | 'active' | 'suspended' | 'archived'>();
	readonly refreshRequested = output<void>();
	readonly clearRequested = output<void>();
	readonly createRequested = output<void>();

	protected onStatusChange(value: string | null): void {
		const status = (value ?? '') as '' | 'active' | 'suspended' | 'archived';
		this.statusChanged.emit(status);
	}
}
