import { inject, Injectable, signal } from '@angular/core';
import { HomeApi } from './home-api';
import { ICardProvs } from '../../../shared/card/card';

@Injectable({
  providedIn: 'root'
})
export class HomeData {
  private homeApi = inject(HomeApi);

  public data = signal<{message: string, username: string}>({message: 'Inventario sincronizado', username: 'admin'});
  public message = signal<string>('Inventario sincronizado');
  public username = signal<string>('admin');
  
  public cardContent = signal<ICardProvs[] | null>([
    {title: 'Inventario', subTitle: 'Stock en tiempo real', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Catálogo completo con filtros y señales para estados inmediatos.'},
    {title: 'Seguridad', subTitle: 'JWT + Roles', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Autenticación robusta con cookies seguras y guardas enrutadas.'},
    {title: 'Auditoría', subTitle: 'Historial trazable', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Registros listos para conciliaciones y control operativo.'}
  ]);

  getData() {
    this.homeApi.getExample().subscribe(res => {
      this.data.set(res);
      this.message.set(res.message);
      this.username.set(res.username);
    });
  }


  constructor() {
    // this.getData();
    console.log(this.data())
  }

}
