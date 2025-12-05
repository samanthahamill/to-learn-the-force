import { inject, Injectable } from '@angular/core';
import { ToastService } from './toast.service';
import { Subject } from 'rxjs';

export interface ConfirmationServiceOptions {
  accept: () => void;
  deny: () => void;
  message: string;
  header: string;
}

@Injectable({
  providedIn: 'root',
})
export class DialogConfirmationService {
  private dialogSubject = new Subject<ConfirmationServiceOptions | null>();
  dialogState = this.dialogSubject.asObservable();
  private toastService = inject(ToastService);

  constructor() {}

  confirmAction(
    accept: () => void,
    deny: () => void,
    message: string = 'Are you sure you want to proceed?',
    header: string = 'Confirmation',
    confirmationHeader: string = 'Confirmed',
    confirmationMessage: string = 'Action performed successfully.',
  ) {
    this.dialogSubject.next({
      message: message,
      header: header,
      accept: () => {
        accept();
        // User confirmed, perform the action
        this.toastService.popSuccessToast(
          confirmationHeader,
          confirmationMessage,
        );
      },
      deny: () => {
        deny();
      },
    });
  }
}
