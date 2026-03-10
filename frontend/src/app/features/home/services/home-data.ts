import { inject, Injectable, signal } from '@angular/core';
import { HomeApi } from './home-api';
import { ICardProvs } from '../../../shared/card/card';
import { IHeroHeaderConfig } from '../components';

@Injectable({
  providedIn: 'root'
})
export class HomeData {
  private homeApi = inject(HomeApi);

  public apiPreview = signal(
    { success: true, message: 'Inventario sincronizado',
      data: { productos: 128, alertasStock: 6, usuario: 'admin',
      },
    }
  );

  public cardContent = signal<ICardProvs[] | null>([
    {title: 'Inventario', subTitle: 'Stock en tiempo real', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Catálogo completo con filtros y señales para estados inmediatos.'},
    {title: 'Seguridad', subTitle: 'JWT + Roles', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Autenticación robusta con cookies seguras y guardas enrutadas.'},
    {title: 'Auditoría', subTitle: 'Historial trazable', cardStyle: 'shadow-none border border-surface-200', bodyStyle: 'text-sm text-surface-600', content: 'Registros listos para conciliaciones y control operativo.'}
  ]);

  public headerConfig = signal<IHeroHeaderConfig>({
      title: 'Mean Admin',
      subTitle: 'Panel integral para operaciones en tiempo real',
      route: [
        {
          label: 'Roadmap',
          icon: 'pi pi-compass',
          buttonStyle: 'p-button-outlined p-button-sm',
          route: '/about'
        },
        {
          label: 'Ingresar',
          icon: 'pi pi-sign-in',
          buttonStyle: 'p-button-success p-button-sm',
          route: '/login'
        }
      ]
    });

  constructor() {}

}
