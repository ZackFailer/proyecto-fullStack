import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, input, Output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Subscription } from 'rxjs';
import { ISelectList } from '../../@core/interfaces/i-select-list';

export interface ISelectProvs {
  options: ISelectList[];
  placeholder?: string;
  optionLabel?: 'name' | 'code';
  optionValue?: 'name' | 'code';
  label?: string;
  value?: ISelectList | string | null;
  control: FormControl<ISelectList | string | null>;
}

@Component({
  selector: 'app-selects-form',
  imports: [SelectModule, ReactiveFormsModule],
  template: `
    @if (selectConfig().label) {
      <label>{{ selectConfig().label }}</label>
    }
    <p-select
      [options]="selectConfig().options"
      [optionLabel]="selectConfig().optionLabel || 'name'"
      [optionValue]="selectConfig().optionValue || 'code'"
      [placeholder]="selectConfig().placeholder"
      [formControl]="selectConfig().control"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectsForm {
  selectConfig = input.required<ISelectProvs>();
}
