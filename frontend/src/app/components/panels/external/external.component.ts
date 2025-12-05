import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CardComponent } from '../../cards/card.component';
import { NgClass, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SystemStateService } from '../../../services/system-state.service';

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

  private systemStateService = inject(SystemStateService);

  importData: boolean;
  ogStartTime!: NgbDateStruct;
  ogEndTime!: NgbDateStruct;
  newStartTime!: NgbDateStruct;
  maxDateTime: Date;

  // TODO set up actual connections

  constructor() {
    this.importData = false;
    this.maxDateTime = this.systemStateService.maxDate;
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
