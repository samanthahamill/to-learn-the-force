import { CommonModule, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  ConfirmationServiceOptions,
  DialogConfirmationService,
} from '../../services/dialog-confirmation.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-dialog-confirmation',
  imports: [CommonModule, NgIf, ConfirmDialogModule],
  templateUrl: './dialog-confirmation.component.html',
  styleUrl: './dialog-confirmation.component.scss',
})
export class DialogConfirmationComponent {
  dialog: ConfirmationServiceOptions | null = null;
  private dialogConfirmationService = inject(DialogConfirmationService);

  title: string = 'Confirmation Dialog';
  message!: string;
  showModal = true;

  constructor() {
    this.dialogConfirmationService.dialogState
      .pipe(untilDestroyed(this))
      .subscribe((message) => {
        if (message != null) {
          this.dialog = message;
          this.title = message.header;
          this.message = message.message;
          this.showModal = true;
        }
      });
  }

  onConfirm() {
    this.showModal = false;
    this.dialog?.accept();
  }

  onDeny() {
    this.showModal = false;
    this.dialog?.deny();
  }
}
