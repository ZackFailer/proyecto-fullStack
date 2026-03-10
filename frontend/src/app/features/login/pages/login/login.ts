import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Auth } from '../../../../@core/services/auth/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CardModule, ButtonModule, InputTextModule, PasswordModule, DividerModule, TagModule],
  template: `
  <main class="min-h-screen bg-surface-50 text-surface-900 flex items-center justify-center px-4 py-10">
    <p-card styleClass="w-full max-w-xl shadow-2 border border-surface-200">
      <ng-template pTemplate="header">

        <div class="flex items-center p-4 justify-between">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500 text-white shadow-md shadow-emerald-400/30">
              <i class="pi pi-lock"></i>
            </span>
            <div>
              <p class="text-xs uppercase tracking-[0.25em] text-emerald-700">Mean Admin</p>
              <p class="text-sm text-surface-500">Accede al panel seguro</p>
            </div>
          </div>
          <p-button label="Volver" icon="pi pi-arrow-left" styleClass="p-button-text p-button-sm" [routerLink]="['/']"></p-button>
        </div>

      </ng-template>

      <div class="space-y-4">
        <div class="space-y-2">
          <p-tag value="Inicio de sesión" severity="success"></p-tag>
          <h1 class="text-2xl font-semibold text-surface-900">Tu espacio de trabajo</h1>
          <p class="text-sm text-surface-600">Usa las credenciales demo (<strong>ejemplo@gmail.com / 123456</strong>) para explorar el dashboard.</p>
        </div>

        <form class="space-y-4" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium text-surface-800">Email</label>
            <input
              pInputText
              type="email"
              id="username"
              class="w-full"
              placeholder="ejemplo@gmail.com"
              formControlName="username"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-surface-800">Password</label>
            <p-password
              id="password"
              [feedback]="false"
              toggleMask="true"
              formControlName="password"
              styleClass="w-full"
              inputStyleClass="w-full"
              placeholder="••••••"
            ></p-password>
          </div>

          <p-button
            type="submit"
            label="Ingresar"
            icon="pi pi-sign-in"
            styleClass="w-full p-button-success"
          ></p-button>
        </form>

        <p-divider></p-divider>

        <div class="space-y-2 text-xs text-surface-600">
          <p class="font-semibold text-emerald-700">Tips rápidos</p>
          <ul class="list-disc space-y-1 pl-4">
            <li>Envelope JSON unificado visible en Home.</li>
            <li>JWT y cookies seguras aplican al iniciar sesión.</li>
            <li>Standalone components + Signals para UI reactiva.</li>
          </ul>
        </div>
      </div>
    </p-card>
  </main>
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
  private readonly router = inject(Router);

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

    this.auth.authenticate(credentials).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: () => {
        console.log('error sdaklfña')
      }
    });
  }

}
