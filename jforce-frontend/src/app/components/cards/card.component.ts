import { CommonModule, NgClass, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFilter,
  faRotate,
  IconDefinition,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { ButtonModule } from 'primeng/button';

export type TypeOfButton = 'CONFIRM' | 'DELETE' | 'NONE';

export type ICON_FUNCTION = {
  icon: IconDefinition;
  type?: TypeOfButton;
  tooltip?: string;
  onClick: () => void;
};

@Component({
  selector: 'app-card',
  imports: [CommonModule, NgIf, NgClass, ButtonModule, FontAwesomeModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class CardComponent {
  @Input() header: string = '';
  @Input() icons: Array<ICON_FUNCTION> = [];

  @Input() innerCard: boolean = false;
  @Input() lighterCard: boolean = false;
  @Input() redIcon: boolean = false;
  @Input() greenIcon: boolean = false;

  refreshIcon = faRotate;
  filterIcon = faFilter;
  questionIcon = faQuestion;

  getIconDefinition(i: number) {
    return this.icons.at(i)!.icon;
  }
}
