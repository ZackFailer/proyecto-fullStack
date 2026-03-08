import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-under-construction',
  imports: [CardModule],
  template: `
    <p-card class="uc-card" header="En construcción">
      <div class="uc-body" role="status" aria-live="polite">
        <span class="uc-icon" aria-hidden="true">
          <i class="pi pi-tools"></i>
        </span>
        <div class="uc-copy">
          <p class="uc-title">{{ featureName() }}</p>
          <p class="uc-text">Estamos trabajando en esta sección. Vuelve pronto para ver las novedades.</p>
        </div>
      </div>
    </p-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .uc-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color);
    }

    .uc-body {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .uc-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: rgba(59, 130, 246, 0.12);
      color: var(--primary-color);
      box-shadow: var(--shadow-1, 0 8px 24px rgba(15, 23, 42, 0.06));
      font-size: 1.1rem;
    }

    .uc-copy {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .uc-title {
      margin: 0;
      font-weight: 700;
      color: var(--text-color);
    }

    .uc-text {
      margin: 0;
      color: var(--text-secondary-color);
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .uc-body {
        align-items: flex-start;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnderConstruction {
  readonly featureName = input<string>('Funcionalidad');
}
