import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ISelectFilter } from '../../../features/tenant/products/services/product-list/product-data';

@Component({
  selector: 'app-table-filter',
  imports: [Card, SelectModule, IconFieldModule, InputIconModule, FormsModule, InputText],
  template: `
    <p-card header='Filtro de tabla' subheader='Agrega filtros para tu tabla'>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
        <p-iconfield class="w-full">
          <p-inputicon class="pi pi-search" />
          <input
            pInputText
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Buscar..."
            class="w-full"
            aria-label="Buscar en la tabla"
          />
        </p-iconfield>
        @for (item of filterConfig().selectFilter; track item.key) {
          <p-select
            class="w-full"
            [options]="item.options"
            [ngModel]="selectValues()[item.key] ?? null"
            (ngModelChange)="onSelectChange(item, $event)"
            optionLabel="name"
            optionValue="name"
            [placeholder]="item.placeholder ?? 'Selecciona'"
            [showClear]="true"
          />
        }
      </div>
    </p-card>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFilter {

  public readonly searchTerm = input<string>('');
  public readonly search = output<string>();
  public readonly selectValues = input<Record<string, string | null>>({});
  public readonly filterConfig = input.required<{
    selectFilter: ISelectFilter[];
  }>();
  public readonly selectionChange = output<{ key: string; value: string | null }>();

  onSearchChange(value: string) {
    this.search.emit(value);
  }

  onSelectChange(item: ISelectFilter, value: string | null) {
    this.selectionChange.emit({ key: item.key, value });
  }

}
