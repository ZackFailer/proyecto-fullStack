import { inject, Injectable, signal } from '@angular/core';
import { HomeApi } from './home-api';

@Injectable({
  providedIn: 'root'
})
export class HomeData {
  private homeApi = inject(HomeApi);

  public data = signal<{message: string, username: string}>({message: '', username: ''});
  public message = signal<string>('');
  public username = signal<string>('');

  getData() {
    this.homeApi.getExample().subscribe(res => {
      this.data.set(res);
      this.message.set(res.message);
      this.username.set(res.username);
    });
  }

  constructor() {
    this.getData();
  }

}
