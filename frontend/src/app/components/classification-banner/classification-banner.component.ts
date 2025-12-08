import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-classification-banner',
  imports: [CommonModule],
  templateUrl: './classification-banner.component.html',
  styleUrl: './classification-banner.component.scss',
})
export class ClassificationBannerComponent {
  @Input() public positionTop = true;
}
