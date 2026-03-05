import { inject, Injectable } from '@angular/core';
import { ICredentials } from '../../interfaces/i-credentials';
import { AuthApi } from './auth-api';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly authApi = inject(AuthApi);

  private $AUTH = 'auth';

  constructor() { }

  public authenticate(credentials: ICredentials) {
    return this.authApi.getToken(credentials).subscribe({
      next: (res) => {
        sessionStorage.setItem(this.$AUTH, res.token);
      }
    })
  }

}
