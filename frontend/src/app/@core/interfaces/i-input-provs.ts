import { FormControl } from "@angular/forms";

export interface IInputProvs {
  type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  placeholder: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string | number | null;
  control?: FormControl<string | number | null>;
}
