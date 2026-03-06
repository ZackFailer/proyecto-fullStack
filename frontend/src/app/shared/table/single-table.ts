import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Button } from "primeng/button";

export interface ITableColumn {
  field: string;
  header: string;
}

export interface ITableConfig<T> {
  item: T[]
  columns: ITableColumn[];
  paginator?: boolean;
  rows?: number;
  [key: string]: any;
  showActions?: boolean;
}
@Component({
  selector: 'app-single-table',
  imports: [TableModule, Button],
  template: `<p-table
      [columns]="tableConfig().columns"
      [value]="tableConfig().item"
      [paginator]="tableConfig().paginator || false"
      [rows]="tableConfig().rows || 5"
      [globalFilterFields]="tableConfig().columns.map(col => col.field)"
      [tableStyle]="{ 'min-width': '50rem' }"
      >
      <ng-template pTemplate="header" let-columns>
        <tr style="font-family: Arial, sans-serif; font-size: 14px; color: #333; text-align: left;">
          @for (col of columns; track $index) {
            <th >
              {{ col.header }}
            </th>
          }
          @if (tableConfig().showActions) {
            <th>
              <div class="text-center">
                Acciones
              </div>
            </th>
          }
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-rowData let-columns="columns">
        <tr style="font-family: Arial, sans-serif; font-size: 14px; color: #555; border-bottom: 1px solid #ddd;">
          @for (col of columns; track $index) {
            <td>
              @if (col.field === 'img') {
                <img [src]="rowData[col.field]" [alt]="col.header" class="table-img" />
              } @else {
                {{ rowData[col.field] }}
              }
            </td>
          }
          @if(tableConfig().showActions) {
            <td>
              <div class="flex justify-center">
                <p-button icon="pi pi-search" size="small" rounded severity="secondary" ></p-button>
              </div>
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: `
    :host {
      display: block;
    }

    .table-img {
      width: 3rem;
      height: 3rem;
      object-fit: cover;
      border-radius: 0.375rem;
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleTable<T> {

  public tableConfig = input.required<ITableConfig<T>>();
  
}
