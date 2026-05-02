import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { BulkImportData } from '../services/bulk-import-data';
import { INewProductTypeWithAttributes } from '../interfaces/product-settings';

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, FileUploadModule, ProgressBarModule, TableModule, TagModule, DialogModule, ToastModule],
  template: `
    <p-toast />
    <div class="grid gap-4">
      <p-card header="Importación Masiva de Productos">
        <div class="space-y-4">
          <div class="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input type="file" accept=".csv" (change)="onFileSelected($event)" class="hidden" #fileInput>
            <div class="cursor-pointer" (click)="fileInput.click()">
              <i class="pi pi-upload text-4xl text-surface-400 mb-2"></i>
              <p class="text-surface-600">Haz clic o arrastra un archivo CSV aquí</p>
              <p class="text-xs text-surface-400 mt-1">Un solo archivo con múltiples tipos de productos</p>
            </div>
          </div>

          @if (selectedFile()) {
            <div class="flex items-center justify-between p-3 bg-surface-50 rounded">
              <div class="flex items-center gap-2">
                <i class="pi pi-file"></i>
                <span>{{ selectedFile()!.name }}</span>
                <span class="text-xs text-surface-500">({{ formatFileSize(selectedFile()!.size) }})</span>
              </div>
              <p-button label="Iniciar Importación" (onClick)="startImport()" [loading]="isImporting()" size="small" />
            </div>
          }
        </div>
      </p-card>

      @if (currentProcess()) {
        <p-card header="Progreso de Importación">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ currentProcess()!.fileName }}</p>
                <p class="text-sm text-surface-500">{{ getStatusLabel(currentProcess()!.status) }}</p>
              </div>
              <p-tag [value]="currentProcess()!.status" [severity]="getStatusSeverity(currentProcess()!.status)" />
            </div>

            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Procesados</span>
                <span>{{ currentProcess()!.processedItems }} / {{ currentProcess()!.totalItems }}</span>
              </div>
              <p-progressBar [value]="getProgressPercent()" [showValue]="false" />
            </div>

            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="p-3 bg-green-50 rounded">
                <p class="text-2xl font-bold text-green-600">{{ currentProcess()!.successItems }}</p>
                <p class="text-xs text-green-700">Exitosos</p>
              </div>
              <div class="p-3 bg-red-50 rounded">
                <p class="text-2xl font-bold text-red-600">{{ currentProcess()!.errorItems }}</p>
                <p class="text-xs text-red-700">Errores</p>
              </div>
              <div class="p-3 bg-surface-100 rounded">
                <p class="text-2xl font-bold">{{ currentProcess()!.totalItems }}</p>
                <p class="text-xs text-surface-600">Total</p>
              </div>
            </div>

            @if (currentProcess()!.status !== 'pending' && currentProcess()!.status !== 'processing') {
              <div class="flex gap-2">
                @if (errors().length > 0) {
                  <p-button label="Descargar Errores" icon="pi pi-download" styleClass="p-button-outlined" (onClick)="downloadErrors()" />
                }
                <p-button label="Limpiar" styleClass="p-button-text" (onClick)="clearProcess()" />
              </div>
            }
          </div>
        </p-card>
      }

      <p-card header="Historial de Importaciones">
        @if (history().length > 0) {
          <p-table [value]="history()" [paginator]="true" [rows]="10" responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr>
                <th>Archivo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Exitosos</th>
                <th>Errores</th>
                <th>Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-process>
              <tr>
                <td>{{ process.fileName }}</td>
                <td>{{ formatDate(process.startedAt) }}</td>
                <td>
                  <p-tag [value]="getStatusLabel(process.status)" [severity]="getStatusSeverity(process.status)" />
                </td>
                <td>{{ process.totalItems }}</td>
                <td class="text-green-600">{{ process.successItems }}</td>
                <td class="text-red-600">{{ process.errorItems }}</td>
                <td>
                  @if (process.errorItems > 0) {
                    <p-button icon="pi pi-eye" styleClass="p-button-text p-button-sm" (onClick)="viewErrors(process.id)" />
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        } @else {
          <p class="text-surface-500 text-center py-4">No hay importaciones previas</p>
        }
      </p-card>

      @if (showErrorsDialog()) {
      <p-dialog 
        header="Errores de Importación" 
        [visible]="showErrorsDialog()" 
        (visibleChange)="onErrorsDialogChange($event)"
        [modal]="true" 
        [style]="{width: '80vw'}"
      >
        @if (errors().length > 0) {
          <p-table [value]="errors()" [paginator]="true" [rows]="20" responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr>
                <th>Fila</th>
                <th>Errores</th>
                <th>Datos Originales</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-error>
              <tr>
                <td>{{ error.rowNumber }}</td>
                <td>
                  @for (err of error.errors; track err.field) {
                    <p class="text-red-600 text-sm">{{ err.field }}: {{ err.message }}</p>
                  }
                </td>
                <td class="text-xs font-mono">
                  {{ error.originalData | json }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-dialog>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BulkImportPage {
  private readonly data = inject(BulkImportData);

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isImporting = this.data.isImporting;
  protected readonly currentProcess = this.data.currentProcess;
  protected readonly history = this.data.history;
  protected readonly errors = this.data.errors;
  
  private readonly _showErrorsDialog = signal<boolean>(false);
  protected readonly showErrorsDialog = this._showErrorsDialog.asReadonly();

  constructor() {
    this.data.loadHistory();
    
    effect(() => {
      const process = this.currentProcess();
      if (process && (process.status === 'completed' || process.status === 'failed' || process.status === 'partial')) {
        if (process.errorItems > 0) {
          this._showErrorsDialog.set(true);
        }
      }
    });
  }

  protected onErrorsDialogChange(visible: boolean): void {
    if (!visible) {
      this._showErrorsDialog.set(false);
    }
  }

  protected getStatusLabel(status: string): string {
    return this.data.getStatusLabel(status);
  }

  protected getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const severities: Record<string, "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined> = {
      completed: 'success',
      processing: 'info',
      pending: 'warn',
      partial: 'warn',
      failed: 'danger'
    };
    return severities[status];
  }

  protected getProgressPercent(): number {
    const process = this.currentProcess();
    if (!process || process.totalItems === 0) return 0;
    return Math.round((process.processedItems / process.totalItems) * 100);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (!input.files[0].name.endsWith('.csv')) {
        alert('Solo se permiten archivos CSV');
        return;
      }
      this.selectedFile.set(input.files[0]);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES');
  }

  startImport(): void {
    const file = this.selectedFile();
    if (file) {
      this.data.startImport(file);
    }
  }

  clearProcess(): void {
    this.selectedFile.set(null);
    this.data.clearCurrentProcess();
  }

  downloadErrors(): void {
    const process = this.currentProcess();
    if (process) {
      this.data.downloadErrorsCsv(process.id);
    }
  }

  viewErrors(processId: string): void {
    this.data.loadErrors(processId);
    this._showErrorsDialog.set(true);
  }
}