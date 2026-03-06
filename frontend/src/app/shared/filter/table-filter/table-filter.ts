import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Card } from "primeng/card";
import { FilterService } from 'primeng/api';
import { ISelectFilter } from '../../../features/products/services/product-data';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { InputText } from "primeng/inputtext";

@Component({
  selector: 'app-table-filter',
  imports: [Card, SelectModule, IconFieldModule, InputIconModule, FormsModule, InputText],
  template: `
    <p-card header='Filtro de tabla' subheader='Agrega filtros para tu tabla'>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <p-iconfield>
          <p-inputicon class="pi pi-search" />
            <input
              pInputText
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearchChange($event)"
              [placeholder]="'Buscar...'"
              />
            </p-iconfield>
        @for (item of filterConfig().selectFilter; track $index) {
          <p-select [options]="item.options" [ngModel]="item.selectedValue" (ngModelChange)="onSelectChange(item, $event)" optionLabel="name" optionValue="name" [placeholder]="item.placeholder"></p-select>
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
  public readonly filterConfig = input.required<{
    selectFilter: ISelectFilter[];
  }>();

  onSearchChange(value: string) {
    this.search.emit(value);
  }

  onSelectChange(item: ISelectFilter, value: string) {
    item.emmitedValue(value);
  }

}
