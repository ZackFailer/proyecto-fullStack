import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header-auth-layout',
  imports: [ButtonModule],
  template: `
    <div class="header-bar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">Admin</span>
        <span class="brand-name">Panel</span>
      </div>
      <p-button
        label="Admin user"
        icon="pi pi-user"
        styleClass="user-button p-button-rounded p-button-outlined"
        severity="secondary"
        aria-label="Cuenta del usuario"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 60%, transparent 100%),
        var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      color: var(--text-color);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: var(--primary-color);
      color: var(--primary-contrast-color);
      font-size: 0.85rem;
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
    }

    .brand-name {
      font-size: 1.05rem;
      color: var(--text-color);
    }

    .user-button {
      border-color: var(--surface-border);
      color: var(--text-color);
    }

    .user-button:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
    }

    @media (max-width: 640px) {
      .header-bar {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .brand-name {
        font-size: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAuthLayout {}
