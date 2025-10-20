import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  Input,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import {
  NgbCalendar,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbTimepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { start } from 'repl';
import { CardComponent } from '../../cards/card.component';

@Component({
  selector: 'app-external-card',
  imports: [
    NgbDatepickerModule,
    NgbTimepickerModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
  ],
  templateUrl: './external.component.html',
  styleUrl: './external.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExternalComponent {
  @Input() formGroup!: FormGroup;
  importIcon = faUpload; // TODO change this icon to be something idfferent

  ogStartTime!: NgbDateStruct;
  ogEndTime!: NgbDateStruct;

  constructor() {}
}
