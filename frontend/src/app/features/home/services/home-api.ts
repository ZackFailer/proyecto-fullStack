import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeApi {
  http = inject(HttpClient);
  apiUrl = '/api';

  constructor() { }

  public getExample(): Observable<any> {
    return this.http.get(`${this.apiUrl}/home`);
  }

}
