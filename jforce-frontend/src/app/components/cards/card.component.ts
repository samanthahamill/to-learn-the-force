import { CommonModule, NgIf } from '@angular/common';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFilter,
  faRotate,
  IconDefinition,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-card',
  imports: [CommonModule, NgIf],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class CardComponent {
  @Input() header: string = '';
  @Input() icon: IconDefinition | undefined = undefined;
  @Input() onIconClick: (() => void) | undefined = undefined;

  refreshIcon = faRotate;
  filterIcon = faFilter;
  questionIcon = faQuestion;

  getIconDefinition() {
    return this.icon ?? 'questionIcon'; // TODO add tooltip
  }

  handleIconClicked() {
    if (this.onIconClick !== undefined) {
      this.onIconClick();
    }
  }
}
