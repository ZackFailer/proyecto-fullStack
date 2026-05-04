import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { IShortCardDashboard } from '../../../../../@core/interfaces/i-short-card-dashboard';

@Component({
  selector: 'app-short-card-dashboard',
  imports: [CardModule],
  template: `
    <p-card>
        <div class="flex flex-col justify-between">
          <div class="flex justify-between gap-2 items-center">
            <div>
              <h1 class=" font-light">{{ item().title }}</h1>
              <p class="text-xl">{{ item().value }}</p>
            </div>
            <i class="{{ item().icon }} rounded-md p-2 {{ item().iconBackground }}" style="color: {{ item().colorIcon }}; font-size: 24px;"></i>
          </div>
            <p class="text-sm font-light"><span class="{{ item().colorDescription }}">{{ item().description }}</span> {{ item().description2 }}</p>
          <div class="">
          </div>
        </div>
      </p-card>
  `,
  styles: `
    :host {
      display: block;
      justify-content: ;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortCardDashboard {

  item = input.required<IShortCardDashboard>();

}
