import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { InputPanelComponent } from '../panels/input-panel/input-panel.component';
import { MapComponent } from '../panels/map/map.component';
import { CommonModule, NgIf } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastService } from '../../services/toast.service';
import { UserStateService } from '../../services/user-state.service';
import { ExternalComponent } from '../panels/external/external.component';

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
      .subscribe((data) => {
        if (data !== undefined) {
          this.updateInput(data);
        }
      });
  }

  ngOnInit(): void {
    if (this.formGroup == null) {
      this.updateInput({});
    }
  }

  updateInput(input: any) {
    if (input !== null) {
      console.log('form initiated');
      this.formGroup = this.fb.group({
        input: this.fb.group({
          platform: this.fb.group({
            isPlaform: [input.platform ?? ''],
          }),
          tools: this.fb.group({
            isTool: [input.tool ?? ''],
          }),
        }),
        external: this.fb.group({
          startTime: [input.external?.startTime ?? new Date()],
          endTime: [input.external?.endTime ?? new Date()],
          type1: [input.external?.type1 ?? false],
          type2: [input.external?.type2 ?? false],
          type3: [input.external?.type3 ?? false],
          type4: [input.external?.type4 ?? false],
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
