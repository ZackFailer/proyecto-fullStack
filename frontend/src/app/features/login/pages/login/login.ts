import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Auth } from '../../../../@core/services/auth/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
  <div class="flex justify-center items-center h-screen">
    <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="flex flex-col">
          <label for="username">Email</label>
          <input type="email" id="username" class="border rounded p-2" formControlName="username">
        </div>
        <div class="flex flex-col">
          <label for="password">Password</label>
          <input type="password" id="password" class="border rounded p-2" formControlName="password">
        </div>
        <div class="flex justify-center mt-6">
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">Login</button>
        </div>
      </form>
    </div>
  </div>
    <p>login works!</p>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);

  constructor() {  }

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required]]
  })

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    const raw = this.loginForm.getRawValue();
    const credentials = {
      email: raw.username ?? '',
      password: raw.password ?? ''
    };
    console.log(credentials);
    
    this.auth.authenticate(credentials);
  }

}
