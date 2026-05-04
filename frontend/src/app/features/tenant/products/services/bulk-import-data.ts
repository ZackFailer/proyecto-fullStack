import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { BulkImportApi, IBulkProcess, IItemProcessLog } from './bulk-import-api';
import { ToastService } from './toast-service';

export interface BulkImportState {
  isImporting: boolean;
  currentProcess: IBulkProcess | null;
  history: IBulkProcess[];
  errors: IItemProcessLog[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BulkImportData {
  private readonly api = inject(BulkImportApi);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  private _isImporting = signal<boolean>(false);
  public readonly isImporting = this._isImporting.asReadonly();

  private _currentProcess = signal<IBulkProcess | null>(null);
  public readonly currentProcess = this._currentProcess.asReadonly();

  private _history = signal<IBulkProcess[]>([]);
  public readonly history = this._history.asReadonly();

  private _errors = signal<IItemProcessLog[]>([]);
  public readonly errors = this._errors.asReadonly();

  private _showErrorsDialog = signal<boolean>(false);
  public readonly showErrorsDialog = this._showErrorsDialog.asReadonly();

  private _loading = signal<boolean>(false);
  public readonly loading = this._loading.asReadonly();

  private _error = signal<string | null>(null);
  public readonly error = this._error.asReadonly();

  public readonly hasActiveProcess = computed(() => {
    const process = this._currentProcess();
    return process !== null && (process.status === 'pending' || process.status === 'processing');
  });

  startImport(file: File): void {
    this._isImporting.set(true);
    this._error.set(null);
    this._loading.set(true);

    this.api.startImport(file).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.toast.bulkImportStarted(file.name);
          
          this._currentProcess.set({
            ...response.data,
            status: 'pending',
            totalItems: 0,
            processedItems: 0,
            successItems: 0,
            errorItems: 0,
            created: 0,
            updated: 0,
            reactivated: 0,
            deactivated: 0,
            deleted: 0,
            startedAt: new Date().toISOString(),
            fileName: file.name,
            fileSize: file.size,
            tenantId: '',
            initiatedBy: '',
          } as unknown as IBulkProcess);

          this.pollProcess(response.data.processId);
          this.loadHistory();
        } else {
          this._error.set(response.message || 'Error al iniciar importación');
          this._isImporting.set(false);
          this._loading.set(false);
          this.toast.showError('Error al iniciar importación', response.message);
        }
      },
      error: (err) => {
        this._error.set('Error al subir archivo');
        this._isImporting.set(false);
        this._loading.set(false);
        this.toast.showError('Error al subir archivo', 'Hubo un problema al procesar el archivo CSV');
        console.error('Import error:', err);
      }
    });
  }

  private pollProcess(processId: string): void {
    this.api.pollProcessStatus(processId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(process => {
      const processIdValue = process?.id || process?._id;
      if (process && processIdValue) {
        const processWithId = { ...process, id: processIdValue };
        this._currentProcess.set(processWithId);
        this._loading.set(false);

        const isTerminal = process.status === 'completed' || process.status === 'failed' || process.status === 'partial';
        if (isTerminal) {
          this._isImporting.set(false);
          this.toast.bulkImportCompleted(process.successItems, process.errorItems);
          this.loadErrors(processIdValue);
          
          if (process.errorItems > 0) {
            this._showErrorsDialog.set(true);
          }
        }
      }
    });
  }

  loadHistory(): void {
    this._loading.set(true);
    this.api.getProcessHistory(1, 20).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const items = response.data.items
            .filter(item => item.id || item._id)
            .map(item => ({
              ...item,
              id: item.id || item._id!,
            }));
          this._history.set(items);
        }
        this._loading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this._loading.set(false);
      }
    });
  }

  loadErrors(processId: string): void {
    this._errors.set([]);
    this.api.getProcessErrors(processId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this._errors.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading errors:', err);
      }
    });
  }

  clearCurrentProcess(): void {
    this._currentProcess.set(null);
    this._errors.set([]);
    this._showErrorsDialog.set(false);
  }

  closeErrorsDialog(): void {
    this._showErrorsDialog.set(false);
  }

  downloadErrorsCsv(processId: string): void {
    const errors = this._errors();
    if (errors.length === 0) return;

    const originalHeaders = Object.keys(errors[0].originalData || {});
    const headers = ['rowNumber', ...originalHeaders, 'accion_intentada', 'error'];
    const rows = errors.map(e => {
      const originalValues = originalHeaders.map((header) => String(e.originalData?.[header] ?? ''));
      const errorMessages = e.errors.map(err => err.message).join('; ');
      return [e.rowNumber, ...originalValues, e.action ?? 'error', errorMessages].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${processId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
      partial: 'Parcial'
    };
    return labels[status] || status;
  }
}
