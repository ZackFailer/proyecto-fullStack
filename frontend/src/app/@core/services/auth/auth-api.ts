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

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  private readonly apiUrl = '/api/auth';
  private readonly http = inject(HttpClient);

  getToken(credentials: ICredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  constructor() { }



}
