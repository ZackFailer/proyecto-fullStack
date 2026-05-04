import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ITableData {
  headers: string[];
  rows: string[][];
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [],
  template: `
    <table style="margin-bottom: 50px; margin:-right: 50px;">
      <thead>
        <tr>
          @for (item of tableData().headers; track $index) {
          <th>{{item}}</th>
          }
        </tr>
      </thead>
      <tbody >
        @for (row of tableData().rows; track $index) {
        <tr>
          @for (cell of row; track $index) {
          <td>{{cell}}</td>
          }
        </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table {
  public tableData = input.required<ITableData>();
}
