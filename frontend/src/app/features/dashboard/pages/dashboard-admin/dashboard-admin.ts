import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DashboardAdminData } from '../../services/dashboard-admin-data';
import { ShortCardDashboard } from "../../components/short-card-dashboard/short-card-dashboard";
import { TableModule } from 'primeng/table';
import { SingleTable } from "../../../../shared/single-table/single-table";
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard-admin',
  imports: [CardModule, ShortCardDashboard, TableModule, SingleTable, ChartModule, ],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      @for (item of shortCardData(); track $index) {
        <app-short-card-dashboard [item]="item" />
      }
    </div>
    <div class="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <p-card header="Ventas recientes" >
        <app-single-table [tableConfig]="tableConfig()" />
      </p-card>
      <p-card header="Graficos de Ventas" >
        <p-chart type="bar" [data]="basicData" [options]="basicOptions" />
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
export default class DashboardAdmin implements OnInit {
  basicData: any;
    basicOptions: any;
    platformId = inject(PLATFORM_ID);
    // configService = inject(AppConfigService);
    // designerService = inject(DesignerService);

  ngOnInit() {
    // this.initChart();
  }

  // initChart() {
  //       if (isPlatformBrowser(this.platformId)) {
  //           const documentStyle = getComputedStyle(document.documentElement);
  //           const textColor = documentStyle.getPropertyValue('--p-text-color');
  //           const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  //           const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');
        
  //           this.basicData = {
  //               labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  //               datasets: [
  //                   {
  //                       label: 'Sales',
  //                       data: [540, 325, 702, 620],
  //                       backgroundColor: ['rgba(249, 115, 22, 0.2)', 'rgba(6, 182, 212, 0.2)', 'rgb(107, 114, 128, 0.2)', 'rgba(139, 92, 246, 0.2)'],
  //                       borderColor: ['rgb(249, 115, 22)', 'rgb(6, 182, 212)', 'rgb(107, 114, 128)', 'rgb(139, 92, 246)'],
  //                       borderWidth: 1
  //                   }
  //               ]
  //           };
        
  //           this.basicOptions = {
  //               maintainAspectRatio: false,
  //               aspectRatio: 0.8,
  //               plugins: {
  //                   legend: {
  //                       labels: {
  //                           color: textColor
  //                       }
  //                   }
  //               },
  //               scales: {
  //                   x: {
  //                       ticks: {
  //                           color: textColorSecondary
  //                       },
  //                       grid: {
  //                           color: surfaceBorder
  //                       }
  //                   },
  //                   y: {
  //                       beginAtZero: true,
  //                       ticks: {
  //                           color: textColorSecondary
  //                       },
  //                       grid: {
  //                           color: surfaceBorder
  //                       }
  //                   }
  //               }
  //           };
  //           this.cd.markForCheck();
  //       }
  //   }

  private readonly dashboardAdminData = inject(DashboardAdminData);

  protected readonly shortCardData = this.dashboardAdminData.shortCardData;
  protected readonly tableConfig = this.dashboardAdminData.tableConfig;
}
