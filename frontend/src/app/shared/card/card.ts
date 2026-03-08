import { Component, inject, input } from "@angular/core";
import { Card } from "primeng/card";

export interface ICardProvs {
  title: string;
  subTitle: string;
  cardStyle: string;
  bodyStyle: string;
  content: string;
}

@Component({
  selector: 'app-simple-card',
  template: `
    <p-card [header]="cardProvs().title" [subheader]="cardProvs().subTitle" [style]="{'height': '100%'}" [styleClass]="cardProvs().cardStyle">
      <p [class]="cardProvs().bodyStyle">{{ cardProvs().content }}</p>
    </p-card>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  imports: [Card]

})

export class SimpleCard {

  cardProvs = input.required<ICardProvs>();

}
