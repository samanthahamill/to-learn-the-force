import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CardComponent } from '../../cards/card.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UserStateService } from '../../../services/user-state.service';
import { DialogEditorService } from '../../../services/dialog-editor.service';
import { createFormDateString } from '../../../shared/utils';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-info-dialog',
  imports: [
    FormsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
  ],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
})
export class InfoDialogComponent {
  info: FormGroup;
  userStateService = inject(UserStateService);
  dialogSerivce = inject(DialogEditorService);
  errorMessage: string | undefined = undefined;

  constructor(private fb: FormBuilder) {
    const metadata = this.userStateService.metadata;

    this.info = this.fb.group({
      scenarioAuthor: new FormControl(metadata?.scenarioAuthor ?? 'TBD', {
        validators: Validators.required,
      }), // TODO eventually pull this from user profile and don't allow to be edited
      dateOfCreation: new FormControl(
        createFormDateString(metadata?.dateOfCreation ?? new Date()),
        { validators: Validators.required }, // TODO eventually don't hardcode this
      ),
      details: new FormControl(metadata?.details ?? '', {
        validators: Validators.required,
      }),
    });

    this.userStateService.input$
      .pipe(untilDestroyed(this))
      .subscribe((info) => {
        if (info) this.info.setValue(info.metadata);
      });

    this.dialogSerivce.metadataPing$
      .pipe(untilDestroyed(this))
      .subscribe((val) => {
        if (val !== 0) {
          this.openModal();
        }
      });
  }

  openModal() {
    $('#scenarioInfoModal').modal('show');
  }

  closeAndSaveModal() {
    // TODO save
    this.userStateService.updateMetadata({
      dateOfCreation: new Date(this.info.get('dateOfCreation')!.value),
      scenarioAuthor: this.info.get('scenarioAuthor')!.value,
      details: this.info.get('details')!.value,
    });
    this.closeModal();
  }

  closeModal() {
    $('#scenarioInfoModal').modal('hide');
  }
}
