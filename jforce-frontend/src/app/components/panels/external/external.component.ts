import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CardComponent } from '../../cards/card.component';
import { NgClass, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-external-card',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    NgIf,
    NgClass,
    ButtonModule,
    ButtonGroupModule,
  ],
  templateUrl: './external.component.html',
  styleUrl: './external.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExternalComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() formUpdated!: () => void;
  importData: boolean;

  ogStartTime!: NgbDateStruct;
  ogEndTime!: NgbDateStruct;
  newStartTime!: NgbDateStruct;

  // TODO set up actual connections

  constructor() {
    this.importData = true;
  }

  ngOnInit(): void {
    this.formGroup?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.formUpdated();
    });
  }

  toggleImportData() {
    this.importData = !this.importData;
  }
}
