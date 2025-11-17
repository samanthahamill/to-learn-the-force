import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { InputPanelComponent } from '../panels/input-panel/input-panel.component';
import { MapComponent } from '../panels/map/map.component';
import { CommonModule, NgIf } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastService } from '../../services/toast.service';
import { UserStateService } from '../../services/user-state.service';
import { ExternalComponent } from '../panels/external/external.component';
import { AOIType, Platform, UserInputFormData } from '../../shared/types';
import { getNewPlatformFormGroup } from '../../shared/create';

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
        if (data !== undefined && data != this.formGroup?.value) {
          this.updateInput(data);
        }
      });
  }

  ngOnInit(): void {
    if (this.formGroup == null) {
      this.updateInput({} as UserInputFormData);
    }
  }

  onUpdated() {
    if (this.formGroup) {
      const inputGroup = this.formGroup
        .get('input')
        ?.get('scenario') as FormGroup;

      this.userStateService.updateInput({
        scenario: {
          baseInfo: inputGroup?.get('baseInfo')?.value ?? {},
          scenarioInput: inputGroup?.get('scenarioInput')?.value ?? {},
        },
        external: this.formGroup.get('input')?.get('external') ?? {},
      } as UserInputFormData);
    }
  }

  updateInput(input: UserInputFormData) {
    if (input !== null) {
      console.log('Form Updated');
      this.formGroup = this.fb.group({
        input: this.fb.group({
          scenario: this.fb.group({
            baseInfo: this.fb.group({
              scenarioName: new FormControl(
                input.scenario?.baseInfo?.scenarioName ?? 'Default Scenario',
                { validators: Validators.required },
              ),
              scenarioAuthor: new FormControl(
                input.scenario?.baseInfo?.scenarioAuthor ?? 'TBD',
                { validators: Validators.required },
              ), // TODO eventually pull this from user profile and don't allow to be edited
              dateOfCreation: new FormControl(
                input.scenario?.baseInfo?.dateOfCreation ??
                  new Date().toISOString(),
                { validators: Validators.required }, // TODO eventually don't hardcode this
              ),
              details: new FormControl(
                input.scenario?.baseInfo?.details ?? '',
                { validators: Validators.required },
              ),
            }),
            scenarioInput: this.fb.group({
              startTime: new FormControl(
                (input.scenario?.scenarioInput?.startTime ?? new Date())
                  .toISOString()
                  .substring(0, 16),
                { validators: Validators.required },
              ),
              endTime: new FormControl(
                (input.scenario?.scenarioInput?.endTime ?? new Date())
                  .toISOString()
                  .substring(0, 16),
                { validators: Validators.required },
              ),
              aoi: this.fb.group({
                lat: new FormControl(
                  input.scenario?.scenarioInput?.aoi.lat ?? 0,
                  { validators: Validators.required },
                ),
                lon: new FormControl(
                  input.scenario?.scenarioInput?.aoi.lon ?? 0,
                  { validators: Validators.required },
                ),
                alt: new FormControl(
                  input.scenario?.scenarioInput?.aoi.alt ?? 0,
                  { validators: Validators.required },
                ),
                radius: new FormControl(
                  input.scenario?.scenarioInput?.aoi.radius ?? 0,
                  { validators: Validators.required },
                ),
              }),
              platforms: this.fb.array([
                ...(input.scenario?.scenarioInput.platforms.map(
                  (platform: Platform, i: number) =>
                    getNewPlatformFormGroup(this.fb, platform.name, platform),
                ) ?? []),
              ]),
            }),
          }),
          tools: this.fb.group({
            isTool: new FormControl(input.tool ?? 'true', {
              validators: Validators.required,
            }),
          }),
        }),
        external: this.fb.group({
          dataType: new FormControl(input.external?.dataType ?? 'IMPORT'),
          newStartTime: new FormControl(
            (input.external?.newStartTime ?? new Date())
              .toISOString()
              .substring(0, 16),
            { validators: Validators.required },
          ),
          import: this.fb.group({
            ogStartTime: new FormControl(
              (input.external?.import?.ogStartTime ?? new Date())
                .toISOString()
                .substring(0, 16),
              { validators: Validators.required },
            ),
            ogEndTime: new FormControl(
              (input.external?.import?.ogEndTime ?? new Date())
                .toISOString()
                .substring(0, 16),
              { validators: Validators.required },
            ),
            type1: new FormControl(input.external?.import?.type1 ?? false, {
              validators: Validators.required,
            }),
            type2: new FormControl(input.external?.import?.type2 ?? false, {
              validators: Validators.required,
            }),
            type3: new FormControl(input.external?.import?.type3 ?? false, {
              validators: Validators.required,
            }),
            type4: new FormControl(input.external?.import?.type4 ?? false, {
              validators: Validators.required,
            }),
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
