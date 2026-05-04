import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
  BackendEnvelope,
  LoginAttemptDTO,
  LoginAttemptFilters,
  LoginAttemptListData,
} from '../interfaces/login-attempt';

@Injectable({
  providedIn: 'root',
})
export class LoginAttemptsApi {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/login-attempts';

  private readonly mockData: LoginAttemptDTO[] = [
    {
      id: 'la-1',
      email: 'admin@example.com',
      userId: '67f50af9e17c6cb95dc93a21',
      clientId: null,
      success: true,
      reason: 'success',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'la-2',
      email: 'viewer@example.com',
      userId: '67f50af9e17c6cb95dc93a22',
      clientId: '67f50af9e17c6cb95dc93b21',
      success: false,
      reason: 'invalid_credentials',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ];

  list(filters: LoginAttemptFilters): Observable<LoginAttemptListData> {
    const params = new HttpParams({
      fromObject: {
        ...(filters.email ? { email: filters.email.trim().toLowerCase() } : {}),
        ...(filters.success ? { success: filters.success } : {}),
        limit: String(filters.limit),
      },
    });

    return this.http
      .get<BackendEnvelope<LoginAttemptListData>>(this.endpoint, { params })
      .pipe(
        map((response) => response.data),
        catchError(() => of(this.mockList(filters)))
      );
  }

  private mockList(filters: LoginAttemptFilters): LoginAttemptListData {
    const email = filters.email.trim().toLowerCase();
    const success = filters.success;

    const filtered = this.mockData.filter((item) => {
      const emailMatch = email ? item.email.toLowerCase().includes(email) : true;
      const successMatch = success === '' ? true : String(item.success) === success;
      return emailMatch && successMatch;
    });

    const items = filtered.slice(0, filters.limit);
    return {
      items,
      total: items.length,
    };
  }
}
