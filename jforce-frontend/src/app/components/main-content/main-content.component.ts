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
        console.log('input updated');
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
      this.userStateService.updateInput(this.formGroup.value);
    }
  }

  updateInput(input: UserInputFormData) {
    if (input !== null) {
      console.log('Default Form Initiated');
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
                    this.fb.group({
                      id: new FormControl(platform.id ?? `Unknown ${i}`, {
                        validators: Validators.required,
                      }),
                      name: new FormControl(platform.name ?? 'Name', {
                        validators: Validators.required,
                      }),
                      type: new FormControl(platform.type ?? 'AIR', {
                        validators: Validators.required,
                      }),
                      maxSpeed: new FormControl(platform.maxSpeed ?? 0, {
                        validators: Validators.required,
                      }),
                      maxDepth: new FormControl(platform.maxDepth ?? 0),
                      maxAlt: new FormControl(platform.maxAlt ?? 0),
                      friendly: new FormControl(platform.friendly ?? true),
                      waypoints: this.fb.array(
                        platform.waypoints?.map((waypoint) =>
                          this.fb.group({
                            lat: new FormControl(waypoint.lat, {
                              validators: Validators.required,
                            }),
                            lon: new FormControl(waypoint.lon, {
                              validators: Validators.required,
                            }),
                            alt: new FormControl(waypoint.alt, {
                              validators: Validators.required,
                            }),
                            datetime: new FormControl(waypoint.datetime, {
                              validators: Validators.required,
                            }),
                            index: new FormControl(waypoint.index, {
                              validators: Validators.required,
                            }),
                            speedKts: new FormControl(waypoint.speedKts, {
                              validators: Validators.required,
                            }),
                          }),
                        ) ?? [],
                      ),
                      reportingFrequency: new FormControl(
                        platform.reportingFrequency ?? 0,
                        { validators: Validators.required },
                      ), // likely not a number
                      readonly: new FormControl(platform.readonly ?? false, {
                        validators: Validators.required,
                      }),
                    }),
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
            input.external?.newStartTime ?? new Date(),
            { validators: Validators.required },
          ),
          import: this.fb.group({
            ogStartTime: new FormControl(
              input.external?.import?.ogStartTime ?? new Date(),
              { validators: Validators.required },
            ),
            ogEndTime: new FormControl(
              input.external?.import?.ogEndTime ?? new Date(),
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
