import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { InputPanelComponent } from '../panels/input-panel/input-panel.component';
import { MapComponent } from '../panels/map/map.component';
import { CommonModule, NgIf } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastService } from '../../services/toast.service';
import { UserStateService } from '../../services/user-state.service';
import { ExternalComponent } from '../panels/external/external.component';
import { Platform, UserInputFormData, UserInputType } from '../../shared/types';

@UntilDestroy()
@Component({
  selector: 'app-main-content',
  imports: [
    InputPanelComponent,
    ExternalComponent,
    MapComponent,
    CommonModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MainContentComponent {
  formGroup: FormGroup | undefined;

  private userStateService = inject(UserStateService);
  private toastService = inject(ToastService);

  constructor(private fb: FormBuilder) {
    this.userStateService.input$
      .pipe(untilDestroyed(this))
      .subscribe((data: UserInputFormData | undefined) => {
        if (data !== undefined) {
          this.updateInput(data);
        }
      });
  }

  ngOnInit(): void {
    if (this.formGroup == null) {
      this.updateInput({} as UserInputFormData);
    }
  }

  updateInput(input: UserInputFormData) {
    if (input !== null) {
      console.log('blank form initiated');
      this.formGroup = this.fb.group({
        input: this.fb.group({
          scenarioInfo: this.fb.group({
            scenarioName: [
              input.scenarioInfo?.scenarioName ?? 'Default Scenario',
            ],
            scenarioAuthor: [input.scenarioInfo?.scenarioAuthor ?? 'TBD'], // TODO eventually pull this from user profile and don't allow to be edited
            dateOfCreation: [
              input.scenarioInfo?.dateOfCreation ??
                `${new Date().toLocaleString()} MST`, // TODO eventually don't hardcode this
            ],
            details: [input.scenarioInfo?.details ?? ''],
            platforms: input.scenarioInfo?.platforms
              ? this.fb.array([
                  ...input.scenarioInfo.platforms.map((platform: Platform) =>
                    this.fb.control(platform, Validators.required),
                  ),
                ])
              : this.fb.array([]),
          }),
          tools: this.fb.group({
            isTool: [input.tool ?? ''],
          }),
        }),
        external: this.fb.group({
          dataType: [input.external?.dataType ?? 'IMPORT'],
          newStartTime: [input.external?.newStartTime ?? new Date()],
          import: this.fb.group({
            ogStartTime: [input.external?.import?.ogStartTime ?? new Date()],
            ogEndTime: [input.external?.import?.ogEndTime ?? new Date()],
            type1: [input.external?.import?.type1 ?? false],
            type2: [input.external?.import?.type2 ?? false],
            type3: [input.external?.import?.type3 ?? false],
            type4: [input.external?.import?.type4 ?? false],
          }),
          upload: this.fb.group({}),
        }),
      });
    }
  }

  getFormGroup(formGroup: string): FormGroup {
    return this.formGroup?.get(formGroup) as FormGroup;
  }

  onSubmit() {
    if (this.formGroup?.valid) {
      this.toastService.showInfoMessage('Form Group Valid');
    } else {
      this.toastService.showErrorMessage(
        'Form Group not Valid',
        'Make sure all necessary values in System Control are filled out before starting a run',
      );
    }
  }
}
