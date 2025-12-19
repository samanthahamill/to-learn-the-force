import { CommonModule } from '@angular/common';
import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { LoadingService } from '../../../services/loading.service';
import { ConfirmationServiceOptions } from '../../../services/dialog-confirmation.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-loading-screen',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class LoadingScreenComponent {
  spinnerIcon = faCircleNotch;

  private loadingService = inject(LoadingService);

  dialog: ConfirmationServiceOptions | null = null;
  initialized = false;
  message: string | undefined = '';

  constructor() {
    this.loadingService.showLoadingMessage$
      .pipe(untilDestroyed(this))
      .subscribe((message) => {
        this.message = message;
        if (!this.initialized) {
          return;
        }

        if (this.message !== undefined) {
          this.openModal();
        } else {
          this.closeModal();
        }
      });
  }

  openModal() {
    $('#loadingScreen').modal('show');
  }

  closeModal() {
    $('#loadingScreen').modal('hide');
  }
}
