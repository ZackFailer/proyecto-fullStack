import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderAuthLayout } from "../../components/header-auth-layout/header-auth-layout";
import { SidebarAuthLayout } from "../../components/sidebar-auth-layout/sidebar-auth-layout";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-auth',
  imports: [HeaderAuthLayout, SidebarAuthLayout, RouterOutlet],
  template: `
  <div class="parent">
    <div class="header">
      <app-header-auth-layout />
    </div>
    <div class="sidebar">
      <app-sidebar-auth-layout />
    </div>
    <div class="content">
      <router-outlet />
    </div>
  </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
    .parent {
      display: grid;
      grid-template-columns: 0.2fr 1fr;
      grid-template-rows: 0.1fr 1fr;
      grid-row-gap: 1rem;
      grid-column-gap: 0rem;
      height: 100vh;
      width: 100vw;
    }

    .header { grid-area: 1 / 1 / 2 / 3; }
    .sidebar { grid-area: 2 / 1 / 3 / 2; }
    .content {
      grid-area: 2 / 2 / 3 / 3;
      padding: 0rem 1rem 1rem 1rem; 
      overflow: scroll;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutAuth { }
