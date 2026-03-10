import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { IProductSettingsMetrics } from '../../interfaces/product-settings';

@Component({
  selector: 'app-product-settings-toolbar',
  template: `
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-[0.35em] text-emerald-700">Product Settings</p>
        <p class="text-lg font-semibold text-surface-900">Tipos de producto y atributos por tenant</p>
        <p class="text-sm text-surface-600">Define, versiona y valida atributos dinámicos para productos. Cambios breaking generan nuevas versiones.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <p-button label="Nuevo tipo" icon="pi pi-plus" styleClass="p-button-success p-button-sm" (onClick)="createRequested.emit()" />
        <p-button label="Publicar cambios" icon="pi pi-send" styleClass="p-button-outlined p-button-sm" severity="secondary" />
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
      <div class="stat-card">
        <span class="stat-label">Tipos activos</span>
        <div class="stat-value">{{ metrics().activeTypes }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tipos publicados</span>
        <div class="stat-value">{{ metrics().publishedTypes }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-label">Atributos totales</span>
        <div class="stat-value">{{ metrics().totalAttributes }}</div>
      </div>
      <div class="stat-card">
        <span class="stat-label">Deprecados</span>
        <div class="flex items-center gap-2">
          <span class="stat-value text-amber-600">{{ metrics().deprecatedAttributes }}</span>
          <!-- @if (metrics().deprecatedAttributes) {
            <p-tag severity="warn" value="Migrar" />
          } -->
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .stat-card {
      padding: 0.85rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 0.9rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.04));
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      letter-spacing: 0.02em;
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TagModule]
})
export class ProductSettingsToolbar {
  readonly metrics = input.required<IProductSettingsMetrics>();
  readonly createRequested = output<void>();
}
