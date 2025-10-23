import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { MainContentComponent } from './components/main-content/main-content.component';
import { ClassificationBannerComponent } from './components/classification-banner/classification-banner.component';
import { CommonModule } from '@angular/common';
import { DialogConfirmationComponent } from './components/dialog-confirmation/dialog-confirmation.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    DialogConfirmationComponent,
    MainContentComponent,
    ToastComponent,
    ClassificationBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent {
  title = 'jforce-frontend';
}
