import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { MessageService, ToastMessageOptions } from 'primeng/api';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [ToastModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  providers: [MessageService],
})
export class ToastComponent implements OnDestroy {
  toast: ToastMessageOptions | null = null;
  private toastSubscription: Subscription;

  constructor(
    private toastService: ToastService,
    private messageService: MessageService,
  ) {
    this.toastSubscription = this.toastService.toastState.subscribe(
      (message) => {
        this.toast = message;
        if (message) {
          this.messageService.add(message);
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
