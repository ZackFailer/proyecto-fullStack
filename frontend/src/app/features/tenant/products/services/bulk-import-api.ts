import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, timer, switchMap, takeUntil, of, catchError, map, filter, takeWhile } from 'rxjs';

export interface IBulkProcess {
  id: string;
  _id?: string;
  tenantId: string;
  initiatedBy: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  totalItems: number;
  processedItems: number;
  successItems: number;
  errorItems: number;
  created: number;
  updated: number;
  reactivated: number;
  deactivated: number;
  deleted: number;
  startedAt: string;
  completedAt?: string;
  errorSummary?: string;
}

export interface IBulkSubProcess {
  id: string;
  processId: string;
  step: 'upload' | 'parsing' | 'validation' | 'import' | 'finalization';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  details?: string;
  errorMessage?: string;
}

export interface IItemProcessError {
  field: string;
  message: string;
  code: string;
}

export interface IItemProcessLog {
  id: string;
  processId: string;
  rowNumber: number;
  status: 'success' | 'error' | 'skipped';
  action?: 'created' | 'updated' | 'reactivated' | 'deactivated' | 'deleted' | 'error';
  originalData: Record<string, string>;
  errors: IItemProcessError[];
  processedAt: string;
  productId?: string;
  retryAttempt?: number;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface IPaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface IBulkImportResult {
  processId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BulkImportApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/bulk-import';

  startImport(file: File): Observable<IApiResponse<IBulkImportResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<IApiResponse<IBulkImportResult>>(`${this.apiUrl}/import`, formData, {
      reportProgress: true,
    });
  }

  getProcessHistory(page: number = 1, limit: number = 20): Observable<IApiResponse<IPaginatedResponse<IBulkProcess>>> {
    return this.http.get<IApiResponse<IPaginatedResponse<IBulkProcess>>>(`${this.apiUrl}/history`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  getProcessDetails(processId: string): Observable<IApiResponse<IBulkProcess>> {
    return this.http.get<IApiResponse<IBulkProcess>>(`${this.apiUrl}/${processId}`);
  }

  getProcessErrors(processId: string): Observable<IApiResponse<IItemProcessLog[]>> {
    return this.http.get<IApiResponse<IItemProcessLog[]>>(`${this.apiUrl}/${processId}/errors`);
  }

  pollProcessStatus(processId: string, intervalMs: number = 2000): Observable<IBulkProcess> {
    const isTerminalStatus = (status: string) => 
      status === 'completed' || status === 'failed' || status === 'partial';

    return timer(0, intervalMs).pipe(
      switchMap(() => this.getProcessDetails(processId)),
      map(response => response.data!),
      takeWhile(process => process && !isTerminalStatus(process.status), true),
      catchError(() => of({} as IBulkProcess))
    );
  }
}
