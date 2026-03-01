import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [],
  template: `<p>about works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class About { }
