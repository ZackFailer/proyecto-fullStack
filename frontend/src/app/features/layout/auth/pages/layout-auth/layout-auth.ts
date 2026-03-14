import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderAuthLayout } from "../../components/header-auth-layout/header-auth-layout";
import { SidebarAuthLayout } from "../../components/sidebar-auth-layout/sidebar-auth-layout";
import { ActivatedRoute, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-auth',
  imports: [HeaderAuthLayout, SidebarAuthLayout, RouterOutlet],
  template: `
  <div class="layout-shell">
    <header class="layout-header" role="banner">
      <app-header-auth-layout />
    </header>
    <aside class="layout-sidebar" aria-label="Navegación principal">
      <app-sidebar-auth-layout />
    </aside>
    <main class="layout-content" role="main">
      <router-outlet />
    </main>
  </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--surface-ground);
      color: var(--text-color);
    }
    .layout-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: clamp(16rem, 20vw, 22rem) 1fr;
      grid-template-rows: auto 1fr;
      gap: 1rem;
      padding: 1rem;
      background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.06), transparent 35%),
        radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.08), transparent 28%),
        var(--surface-ground);
    }

    .layout-header {
      grid-column: 1 / -1;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg, 1rem);
      box-shadow: var(--shadow-2, 0 10px 30px rgba(15, 23, 42, 0.08));
      overflow: hidden;
    }

    .layout-sidebar {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg, 1rem);
      padding: 1rem;
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
      position: sticky;
      top: 1rem;
      align-self: start;
      min-height: calc(100vh - 3rem);
      overflow: auto;
    }

    .layout-content {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius-lg, 1rem);
      padding: 1.25rem;
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
      overflow: auto;
    }

    @media (max-width: 1024px) {
      .layout-shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
      }

      .layout-sidebar {
        position: relative;
        top: auto;
        min-height: auto;
      }
    }

    @media (max-width: 640px) {
      .layout-shell {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .layout-content {
        padding: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LayoutAuth {
  

  constructor() {
    
  }

  
}
