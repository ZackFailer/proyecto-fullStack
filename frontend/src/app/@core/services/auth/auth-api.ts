import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICredentials } from '../../interfaces/i-credentials';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  private readonly apiUrl = '/api/auth';
  private readonly http = inject(HttpClient);

  getToken(credentials: ICredentials): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  constructor() { }



}
