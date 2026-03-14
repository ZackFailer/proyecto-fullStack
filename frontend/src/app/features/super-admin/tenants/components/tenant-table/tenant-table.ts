import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TenantListItemDTO, TenantStatus } from '../../interfaces/tenant';

@Component({
	selector: 'app-tenant-table',
	imports: [TableModule, TagModule, ButtonModule],
	template: `
		<p-table
			[value]="tenants()"
			[loading]="loading()"
			[paginator]="true"
			[rows]="10"
			[rowsPerPageOptions]="[10, 20, 50]"
			dataKey="id"
			responsiveLayout="scroll"
			styleClass="p-datatable-sm"
		>
			<ng-template pTemplate="header">
				<tr>
					<th>Tenant</th>
					<th>Slug</th>
					<th>Documento</th>
					<th>Estado</th>
					<th class="text-right">Acciones</th>
				</tr>
			</ng-template>

			<ng-template pTemplate="body" let-row>
				<tr>
					<td>
						<div class="font-semibold">{{ row.name }}</div>
						<small class="text-color-secondary">{{ row.documentType || 'Documento' }}</small>
					</td>
					<td>{{ row.slug }}</td>
					<td>{{ row.documentNumber || '-' }}</td>
					<td>
						<p-tag [value]="labelForStatus(row.status)" [severity]="severityForStatus(row.status)" />
					</td>
					<td>
						<div class="flex justify-end gap-2">
							<p-button label="Entrar" icon="pi pi-arrow-right" styleClass="p-button-text p-button-sm" (onClick)="openTenant.emit(row.id)" />
							<p-button label="Editar" icon="pi pi-pencil" styleClass="p-button-text p-button-sm" (onClick)="editTenant.emit(row.id)" />
						</div>
					</td>
				</tr>
			</ng-template>

			<ng-template pTemplate="emptymessage">
				<tr>
					<td colspan="5">No hay tenants para los filtros actuales.</td>
				</tr>
			</ng-template>
		</p-table>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantTable {
	readonly tenants = input.required<TenantListItemDTO[]>();
	readonly loading = input<boolean>(false);

	readonly openTenant = output<string>();
	readonly editTenant = output<string>();

	protected labelForStatus(status: TenantStatus): string {
		if (status === 'active') return 'Activo';
		if (status === 'suspended') return 'Suspendido';
		if (status === 'archived') return 'Archivado';
		return status;
	}

	protected severityForStatus(status: TenantStatus): 'success' | 'warn' | 'secondary' {
		if (status === 'active') return 'success';
		if (status === 'suspended') return 'warn';
		return 'secondary';
	}
}
