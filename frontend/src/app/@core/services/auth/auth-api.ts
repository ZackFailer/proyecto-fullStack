import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICredentials } from '../../interfaces/i-credentials';
import { Observable } from 'rxjs';
import { AuthUser } from './auth';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: { token: string; user: AuthUser } | null;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: { user: AuthUser } | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  private readonly apiUrl = '/api/auth';
  private readonly http = inject(HttpClient);

  getToken(credentials: ICredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  changePassword(payload: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/change-password`,
      payload,
      { withCredentials: true }
    );
  }
}