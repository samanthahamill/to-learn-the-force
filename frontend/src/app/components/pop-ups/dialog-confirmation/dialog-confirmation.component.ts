import { CommonModule } from '@angular/common';
import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  ConfirmationServiceOptions,
  DialogConfirmationService,
} from '../../../services/dialog-confirmation.service';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-dialog-confirmation',
  imports: [CommonModule],
  templateUrl: './dialog-confirmation.component.html',
  styleUrl: './dialog-confirmation.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class DialogConfirmationComponent {
  dialog: ConfirmationServiceOptions | null = null;
  private dialogConfirmationService = inject(DialogConfirmationService);

  title: string = 'Confirmation Dialog';
  message!: string;

  constructor() {
    this.dialogConfirmationService.dialogState
      .pipe(untilDestroyed(this))
      .subscribe((message) => {
        if (message != null) {
          this.dialog = message;
          this.title = message.header;
          this.message = message.message;
          this.openModal();
        }
      });
  }

  openModal() {
    $('#confirmationDialog').modal('show');
  }

  closeModal() {
    $('#confirmationDialog').modal('hide');
  }

  onConfirm() {
    this.closeModal();
    this.dialog?.accept();
  }

  onDeny() {
    this.closeModal();
    this.dialog?.deny();
  }
}
