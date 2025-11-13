import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFilter,
  faRotate,
  IconDefinition,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ButtonModule } from 'primeng/button';
import { ColorPicker, ColorPickerModule } from 'primeng/colorpicker';
import { hexToRgb } from '../../shared/utils';
import { FormsModule } from '@angular/forms';

export type TypeOfButton = 'CONFIRM' | 'DELETE' | 'NONE';

export type ICON_FUNCTION = {
  icon: IconDefinition;
  type?: TypeOfButton;
  tooltip?: string;
  onClick: () => void;
};

@UntilDestroy()
@Component({
  selector: 'app-card',
  imports: [
    CommonModule,
    ButtonModule,
    FontAwesomeModule,
    ColorPicker,
    FormsModule,
    NgIf,
    NgClass,
    NgFor,
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class CardComponent implements OnChanges {
  @Input() header: string = '';
  @Input() icons: Array<ICON_FUNCTION> = [];

  @Input() innerCard: boolean = false;
  @Input() lighterCard: boolean = false;
  @Input() redIcon: boolean = false;
  @Input() greenIcon: boolean = false;

  @Output() onColorChange = new EventEmitter<string>();

  refreshIcon = faRotate;
  filterIcon = faFilter;
  questionIcon = faQuestion;

  @Input()
  platformColor: string | undefined = undefined;
  previousColor: string | undefined = undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['platformColor']) {
      if (this.platformColor !== this.previousColor) {
        this.previousColor = this.platformColor;
        this.onColorChange?.emit(this.platformColor);
      }
    }
  }

  getIconDefinition(i: number) {
    return this.icons.at(i)!.icon;
  }
}
