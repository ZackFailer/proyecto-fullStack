import { ChangeDetectionStrategy, Component, inject, OnInit, } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DashboardAdminData } from '../../services/dashboard-admin-data';
import { ShortCardDashboard } from "../../components/short-card-dashboard/short-card-dashboard";
import { TableModule } from 'primeng/table';
import { SingleTable } from "../../../../shared/table/single-table";
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard-admin',
  imports: [CardModule, ShortCardDashboard, TableModule, SingleTable, ChartModule, ],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      @for (item of shortCardData(); track $index) {
        <app-short-card-dashboard [item]="item" />
      }
    </div>
    <div class="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <p-card header="Ventas recientes" >
        <app-single-table [tableConfig]="tableConfig()" />
      </p-card>
      <p-card header="Graficos de Ventas" [style]="{ height: '100' }" >
        <p-chart type="bar" [data]="chartData().data" [options]="chartData().options" class="h-112" />
      </p-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardAdmin {

  private readonly dashboardAdminData = inject(DashboardAdminData);

  protected readonly shortCardData = this.dashboardAdminData.shortCardData;
  protected readonly tableConfig = this.dashboardAdminData.tableConfig;
  protected readonly chartData = this.dashboardAdminData.chartData;
}
