import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HomeApi } from '../services/home-api';
import { HomeData } from '../services/home-data';
import { JsonPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [JsonPipe, RouterLink],
  template: `
    <header class="flex justify-center">
      <nav class="flex gap-4">
        <a routerLink="/about">About</a>
        <a routerLink="/login">Login</a>
      </nav>
    </header>
    <p>home works!</p>
    <p>Data: {{data() | json}}</p>
    <p>Message: {{ message() }}</p>
    <p>Username: {{ username() }}</p>
    <h1 class="text-3xl font-bold underline">
      Hello world!
    </h1>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  private readonly homeData = inject(HomeData);
  

  protected readonly data = this.homeData.data;
  protected readonly message = this.homeData.message;
  protected readonly username = this.homeData.username;

  constructor() {  }


}
