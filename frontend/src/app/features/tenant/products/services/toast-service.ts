import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly messageService = inject(MessageService);

  show(severity: ToastSeverity, summary: string, detail?: string, life: number = 3000): void {
    this.messageService.add({
      severity,
      summary,
      detail: detail || '',
      life,
    });
  }

  showSuccess(summary: string, detail?: string): void {
    this.show('success', summary, detail);
  }

  showError(summary: string, detail?: string): void {
    this.show('error', summary, detail, 5000);
  }

  showInfo(summary: string, detail?: string): void {
    this.show('info', summary, detail);
  }

  showWarn(summary: string, detail?: string): void {
    this.show('warn', summary, detail, 4000);
  }

  bulkImportStarted(fileName: string): void {
    this.showInfo('Importación iniciada', `El archivo "${fileName}" está siendo procesado.`);
  }

  bulkImportCompleted(successCount: number, errorCount: number): void {
    if (errorCount === 0) {
      this.showSuccess('Importación completada', `${successCount} productos importados exitosamente.`);
    } else if (successCount === 0) {
      this.showError('Importación fallida', `${errorCount} productos no pudieron ser importados.`);
    } else {
      this.showWarn('Importación parcial', `${successCount} importados, ${errorCount} con errores.`);
    }
  }

  bulkImportFailed(error: string): void {
    this.showError('Importación fallida', error);
  }
}