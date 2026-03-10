import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { ICredentials } from '../../interfaces/i-credentials';
import { AuthApi, LoginResponse } from './auth-api';

export interface AuthUser {
  id: string;
  role: 'super-admin' | 'admin' | 'operator' | 'viewer';
  clientId: string | null;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly authApi = inject(AuthApi);
  private readonly userKey = 'auth_user';

  private user = signal<AuthUser | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  public authenticate(credentials: ICredentials) {
    return this.authApi.getToken(credentials).pipe(
      tap((res) => {
        const user = res.data?.user;
        if (user) {
          this.user.set(user);
          sessionStorage.setItem(this.userKey, JSON.stringify(user));
        }
      })
    );
  }

  public clearSession() {
    this.user.set(null);
    sessionStorage.removeItem(this.userKey);
  }

  public isAuthenticated():boolean {
    return !!this.user();
  }

  private loadFromStorage() {
    const storedUser = sessionStorage.getItem(this.userKey)
    if (storedUser) {
      try {
        this.user.set(JSON.parse(storedUser));
      } catch {
        this.user.set(null);
      }
    }
  }

}
