import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-header-auth-layout',
  imports: [],
  template: `<p>header-auth-layout works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAuthLayout { }
