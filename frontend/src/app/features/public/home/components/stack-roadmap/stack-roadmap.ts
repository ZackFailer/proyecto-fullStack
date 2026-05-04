import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-home-stack-roadmap',
  template: `
    <p-card styleClass="shadow-1 border border-surface-200">
      <div class="grid gap-4 md:grid-cols-3">
        <div class="space-y-2">
          <p-tag value="Frontend" severity="info"></p-tag>
          <ul class="text-sm text-surface-700 space-y-1">
            <li>Angular 21 standalone + Signals</li>
            <li>PrimeNG 21 + PrimeUIX themes</li>
            <li>Tailwind CSS v4 utilitario</li>
          </ul>
        </div>
        <div class="space-y-2">
          <p-tag value="Backend" severity="warn"></p-tag>
          <ul class="text-sm text-surface-700 space-y-1">
            <li>Node.js + Express 5</li>
            <li>MongoDB + Mongoose</li>
            <li>JWT, cookies seguras, middlewares</li>
          </ul>
        </div>
        <div class="space-y-2">
          <p-tag value="Roadmap" severity="success"></p-tag>
          <ul class="text-sm text-surface-700 space-y-1">
            <li>Gestión de usuarios y perfiles</li>
            <li>Carga masiva y conciliaciones</li>
            <li>Dashboards con métricas en tiempo real</li>
          </ul>
        </div>
      </div>
    </p-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, TagModule]
})
export class HomeStackRoadmap {}
