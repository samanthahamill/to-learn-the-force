import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  ConfirmationServiceOptions,
  DialogConfirmationService,
} from '../../../services/dialog-confirmation.service';
declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-dialog-confirmation',
  imports: [CommonModule, ConfirmDialogModule],
  templateUrl: './dialog-confirmation.component.html',
  styleUrl: './dialog-confirmation.component.scss',
})
export class DialogConfirmationComponent {
  dialog: ConfirmationServiceOptions | null = null;
  private dialogConfirmationService = inject(DialogConfirmationService);

  title: string = 'Confirmation Dialog';
  message!: string;

  @ViewChild('confirmationDialog') modal!: ElementRef;

  constructor() {
    this.dialogConfirmationService.dialogState
      .pipe(untilDestroyed(this))
      .subscribe((message) => {
        if (message != null) {
          this.dialog = message;
          this.title = message.header;
          this.message = message.message;
        }
      });
  }

  openModal() {
    $(this.modal.nativeElement).modal('show');
  }

  closeModal() {
    $(this.modal.nativeElement).modal('hide');
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
