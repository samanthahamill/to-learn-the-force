import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CommonModule, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-dialog',
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
  ],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class DialogComponent {
  @Input() modelTitle: string = '';
  @Input() validateModel!: () => string;
  @Input() openModalInput!: (val: string) => void;
  @Input() closeModalInput!: (val: string) => void;
  @Output() closeModalOutput = new EventEmitter<void>();

  theresAnError: boolean = false;
  errorMessage: string | undefined;

  constructor() {}

  openModal() {
    this.openModalInput('#modal');
    // $('#modal').modal('show');
  }

  closeModal() {
    this.closeModalInput('#modal');
    // $('#modal').modal('hide');
  }

  closeAndSaveModal() {
    const error = this.validateModel();

    if (error !== '') {
      this.theresAnError = true;
      this.errorMessage = error;
    } else {
      this.theresAnError = false;
      this.closeModalOutput.emit();
    }
  }
}
