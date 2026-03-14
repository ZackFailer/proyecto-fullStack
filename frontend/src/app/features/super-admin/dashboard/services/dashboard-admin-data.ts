import { computed, inject, Injectable, signal } from '@angular/core';
import { IShortCardDashboard } from '../../../../@core/interfaces/i-short-card-dashboard';
import { ITableColumn, ITableConfig } from '../../../../shared/table/single-table';
import { IProduct } from '../../../../@core/interfaces/i-product';
import { DashboardAdminApi } from './dashboard-admin-api';

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminData {
  private readonly dashboardApi = inject(DashboardAdminApi);

  public readonly shortCardData = signal<IShortCardDashboard[]>([]);
  private readonly products = signal<IProduct[]>([]);
  public readonly chartData = signal<{data:any, options:any}>({data: {}, options: {}});

  private readonly cols = signal<ITableColumn[]>([
    { field: 'img', header: 'Imagen' },
    { field: 'name', header: 'Nombre' },
    { field: 'price', header: 'Precio' },
  ]);

  public readonly tableConfig = computed<ITableConfig<IProduct>>(() => ({
    item: this.products(),
    columns: this.cols(),
    showActions: true,
    paginator: true,
    rows: 5
  }));

  constructor() {
    this.initDashboard();
  }

  private readonly initDashboard = (): void => {
    this.dashboardApi.getShortCardData().subscribe(data => this.shortCardData.set(data));
    this.dashboardApi.getProductsDashboard().subscribe(data => this.products.set(data));
    this.dashboardApi.getChartData().subscribe(data => this.chartData.set(data));
  }

}

