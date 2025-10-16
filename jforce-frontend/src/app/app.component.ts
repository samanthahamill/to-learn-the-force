import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputPanelComponent } from './components/panels/input-panel/input-panel.component';
import { MapComponent } from './components/panels/map/map.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { ClassificationBannerComponent } from './components/classification-banner/classification-banner.component';

@Component({
  selector: 'app-root',
  imports: [MainContentComponent, ClassificationBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent {
  title = 'jforce-frontend';
}
