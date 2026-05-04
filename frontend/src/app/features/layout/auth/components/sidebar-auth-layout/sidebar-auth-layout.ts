import { ChangeDetectionStrategy, Component, inject, Signal, signal } from '@angular/core';
import { PanelMenu } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { LayoutAdminData } from '../../services/layout-admin-data';

@Component({
  selector: 'app-sidebar-auth-layout',
  imports: [PanelMenu],
  template: `
    <div class="card flex justify-center">
      <p-panelmenu [model]="items()" class="w-full md:w-80" />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarAuthLayout {
  private readonly layoutAdminData = inject(LayoutAdminData);

  items = this.layoutAdminData.itemSidebar;

}
