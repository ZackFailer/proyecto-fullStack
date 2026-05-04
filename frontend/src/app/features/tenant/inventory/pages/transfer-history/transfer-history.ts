import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ITransferListItem, InventoryApi } from '../../services/inventory-api';

@Component({
  selector: 'app-transfer-history',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, PaginatorModule],
  template: `
    <div class="grid gap-4">
      <p-card header="Historial de Transferencias de Inventario">
        @if (loading()) {
          <div class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl"></i>
          </div>
        } @else if (error()) {
          <div class="text-red-600 p-4">{{ error() }}</div>
        } @else if (transfers().length === 0) {
          <div class="text-center py-8 text-surface-500">
            <i class="pi pi-inbox text-4xl mb-4 block"></i>
            No hay transferencias registradas
          </div>
        } @else {
          <p-table [value]="transfers()" [paginator]="false" responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Cantidad</th>
                <th>Conversión</th>
                <th>Estado</th>
                <th>Acciones</th>
                <th>Motivo</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-transfer>
              <tr>
                <td>{{ formatDate(transfer.createdAt) }}</td>
                <td>
                  <span class="font-mono">{{ transfer.fromSKU }}</span>
                </td>
                <td>
                  <span class="font-mono">{{ transfer.toSKU }}</span>
                </td>
                <td>
                  <span class="font-semibold">{{ transfer.quantityFrom }}</span>
                  @if (transfer.conversionApplied) {
                    <span class="text-surface-500"> → {{ transfer.quantityTo }}</span>
                  }
                </td>
                <td>
                  @if (transfer.conversionApplied) {
                    <p-tag value="Conversión" severity="info" />
                    @if (transfer.conversionFactor) {
                      <div class="text-xs text-surface-500 mt-1">
                        {{ transfer.conversionFactor.fromAttribute }}: {{ transfer.conversionFactor.fromValue }} → {{ transfer.conversionFactor.toAttribute }}: {{ transfer.conversionFactor.toValue }}
                      </div>
                    }
                  } @else {
                    <p-tag value="1 a 1" severity="secondary" />
                  }
                </td>
                <td>
                  <p-tag 
                    [value]="getStatusLabel(transfer.status)" 
                    [severity]="getStatusSeverity(transfer.status)" 
                  />
                </td>
                <td>
                  @if (transfer.status === 'completed' && !isRollbackTransfer(transfer)) {
                    <p-button
                      label="Deshacer"
                      icon="pi pi-undo"
                      size="small"
                      [text]="true"
                      severity="warn"
                      (onClick)="rollbackTransfer(transfer.id)"
                    />
                  } @else {
                    <span class="text-surface-500 text-xs">-</span>
                  }
                </td>
                <td class="text-surface-600 text-sm">
                  {{ transfer.reason || '-' }}
                </td>
              </tr>
            </ng-template>
          </p-table>

          <p-paginator 
            [rows]="pageState().limit" 
            [totalRecords]="totalRecords()" 
            [first]="pageState().page * pageState().limit"
            (onPageChange)="onPageChange($event)"
            styleClass="mt-4"
          />
        }
      </p-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TransferHistoryPage implements OnInit {
  private readonly inventoryApi = inject(InventoryApi);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly transfers = signal<ITransferListItem[]>([]);
  protected readonly totalRecords = signal(0);
  
  protected readonly pageState = signal({ page: 0, limit: 10 });

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading.set(true);
    this.error.set(null);

    const { page, limit } = this.pageState();

    this.inventoryApi.getTransfers().subscribe({
      next: (response) => {
        if (response.success) {
          this.transfers.set(response.data.items);
          this.totalRecords.set(response.data.total);
        } else {
          this.error.set(response.message || 'Error al cargar transferencias');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error de conexión');
        this.loading.set(false);
      }
    });
  }

  rollbackTransfer(transferId: string): void {
    this.loading.set(true);
    this.inventoryApi.rollbackTransfer(transferId).subscribe({
      next: () => {
        this.loadTransfers();
      },
      error: () => {
        this.error.set('No se pudo revertir la transferencia');
        this.loading.set(false);
      },
      complete: () => {},
    });
  }

  isRollbackTransfer(transfer: ITransferListItem): boolean {
    return transfer.source?.type === 'rollback';
  }

  onPageChange(event: PaginatorState): void {
    this.pageState.set({ page: event.page ?? 0, limit: event.rows ?? 10 });
    this.loadTransfers();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      completed: 'Completada',
      pending: 'Pendiente',
      failed: 'Fallida',
      reverted: 'Revertida'
    };
    return labels[status] ?? status;
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const severities: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined> = {
      completed: 'success',
      pending: 'warn',
      failed: 'danger',
      reverted: 'info'
    };
    return severities[status];
  }
}
