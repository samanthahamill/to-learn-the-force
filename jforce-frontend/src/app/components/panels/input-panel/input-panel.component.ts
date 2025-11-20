import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScenarioInputPanelComponent } from '../scenario-input/scenario-input-panel.component';
import { CommonModule, NgIf } from '@angular/common';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-input-panel',
  imports: [
    ScenarioInputPanelComponent,
    FontAwesomeModule,
    CommonModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './input-panel.component.html',
  styleUrl: './input-panel.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class InputPanelComponent {
  @Input() formGroup!: FormGroup;
  @Input() onSubmit!: () => void;
  @Input() formUpdated!: () => void;
  importIcon = faUpload;
  exportIcon = faDownload;

  constructor() {}

  onUpdated(): void {
    this.formUpdated();
  }

  getFormGroup(formGroup: string): FormGroup {
    return this.formGroup?.get(formGroup) as FormGroup;
  }

  getScenarioFormGroup(formGroup: string): FormGroup {
    return (this.formGroup?.get('scenario') as FormGroup)?.get(
      formGroup,
    ) as FormGroup;
  }
}
