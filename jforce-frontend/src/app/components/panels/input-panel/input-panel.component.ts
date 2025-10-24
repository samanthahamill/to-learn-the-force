import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScenarioComponent } from '../../cards/scenario/scenario.component';
import { ToolsComponent } from '../../cards/tools/tools.component';
import { CommonModule, NgIf } from '@angular/common';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { InfoCardComponent } from '../../cards/info/info-card.component';

@Component({
  selector: 'app-input-panel',
  imports: [
    ScenarioComponent,
    ToolsComponent,
    CommonModule,
    InfoCardComponent,
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
  importIcon = faUpload;
  exportIcon = faDownload;

  constructor() {}

  getFormGroup(formGroup: string): FormGroup {
    return this.formGroup?.get(formGroup) as FormGroup;
  }

  getScenarioFormGroup(formGroup: string): FormGroup {
    return this.formGroup?.get('scenario')?.get(formGroup) as FormGroup;
  }
}
