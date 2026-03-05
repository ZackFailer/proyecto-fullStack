import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DashboardAdminData } from '../../services/dashboard-admin-data';
import { ShortCardDashboard } from "../../components/short-card-dashboard/short-card-dashboard";

@Component({
  selector: 'app-dashboard-admin',
  imports: [CardModule, ShortCardDashboard],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      @for (item of shortCardData(); track $index) {
        <app-short-card-dashboard [item]="item" />
      }
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
}
