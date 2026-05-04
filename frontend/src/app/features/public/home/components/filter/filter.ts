import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-filter',
  imports: [],
  template: `
    <input (input)="onSearchChange($event.target.value)" placeholder="Filter..."/>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Filter {

  public readonly searchTerm = output<string>();

  protected onSearchChange(value:string) {
    this.searchTerm.emit(value);
    console.log(value);
  }

}
