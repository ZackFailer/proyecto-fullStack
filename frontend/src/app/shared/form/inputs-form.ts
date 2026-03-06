import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { IInputProvs } from '../../@core/interfaces/i-input-provs';

@Component({
  selector: 'app-inputs',
  imports: [InputTextModule, ReactiveFormsModule],
  template: `
    @if (data().label) {
      <label>{{ data().label }}</label>
    }
    <input
      pInputText
      [type]="data().type"
      [placeholder]="data().placeholder"
      [required]="data().required || false"
      [disabled]="data().disabled || false"
      [formControl]="control"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsForm {
  data = input.required<IInputProvs>();
  private readonly fallbackControl = new FormControl<string | number | null>(null);

  get control(): FormControl<string | number | null> {
    const ctrl = this.data().control ?? this.fallbackControl;
    if (this.data().value !== undefined && ctrl.value !== this.data().value) {
      ctrl.setValue(this.data().value as string | number | null, { emitEvent: false });
    }
    return ctrl;
  }
}
