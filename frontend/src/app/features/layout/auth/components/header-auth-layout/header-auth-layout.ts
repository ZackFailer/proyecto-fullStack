import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header-auth-layout',
  imports: [ButtonModule],
  template: `<div class="flex h-full px-4 items-center justify-between bg-gray-800 text-white">
    <h1 class="text-xl font-bold">My App</h1>
    <p-button label="Admin user" icon="pi pi-user" [rounded]="true" severity="info"/> 
  </div>`,
  styles: `

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderAuthLayout {

}
