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
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SystemStateService } from '../../../services/system-state.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleNotch,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { ConversionRepository } from '../../../state/conversion.repository';
import { ToastService } from '../../../services/toast.service';
import { ConnectionRepository } from '../../../state/connection.repository';
import { LoadingService } from '../../../services/loading.service';
import saveAs from 'file-saver';
import { HttpErrorResponse } from '@angular/common/http';

type FileConversionState =
  | 'WAITING_FOR_CONVERSION'
  | 'ERROR_CONVERTING'
  | 'VALID'
  | 'INVALID'
  | 'COMPLETE'
  | 'NOT_LOADED';

@UntilDestroy()
@Component({
  selector: 'app-external-card',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    NgIf,
    NgClass,
    ButtonModule,
    ButtonGroupModule,
    FontAwesomeModule,
  ],
  templateUrl: './external.component.html',
  styleUrl: './external.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExternalComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() formUpdated!: () => void;

  spinnerIcon = faCircleNotch;
  errorIcon = faTriangleExclamation;

  private systemStateService = inject(SystemStateService);
  private connectionRepository = inject(ConnectionRepository);
  private loadingService = inject(LoadingService);
  private conversionRepository = inject(ConversionRepository);
  private toastService = inject(ToastService);

  importData: boolean;
  ogStartTime!: NgbDateStruct;
  ogEndTime!: NgbDateStruct;
  newStartTime!: NgbDateStruct;
  maxDateTime: Date;

  fileState: FileConversionState;

  backendConnected: boolean = false;

  newStartTimeFile: string;
  timeZone: string = 'UTC';
  timeZoneOptions: Array<any> = [
    { name: 'Zulu', value: 'UTC' },
    { name: 'Denver', value: 'America/Denver' },
    { name: 'New York', value: 'America/New_York' },
    { name: 'Los Angeles', value: 'America/Los_Angeles' },
    { name: 'Hawaii', value: 'US/Hawaii' },
    { name: 'Japan', value: 'Japan' },
    { name: 'Bahrain', value: 'Asia/Bahrain' },
  ];

  constructor() {
    this.fileState = 'NOT_LOADED';
    this.importData = false;
    this.maxDateTime = this.systemStateService.maxDate;
    this.newStartTimeFile = new Date().toISOString().substring(0, 16);
  }

  utcDate = new Date();

  // Method to format the UTC date as a string for the <input type="datetime-local">
  get localInputValue(): string {
    return new Date(
      this.utcDate.toLocaleString('en-US', { timeZone: this.timeZone }),
    )
      .toISOString()
      .slice(0, 16);
  }

  dateTimeUpdated(event: Event | string): void {
    let date: string;
    if (typeof event !== 'string') {
      const target = event.target as HTMLInputElement;
      date = target.value;
    } else {
      date = event;
    }

    // account for daylight savings later
    switch (this.timeZone) {
      case 'America/Denver':
        date += ':00.000-0700';
        break;
      case 'America/New_York':
        date += ':00.000-0500';
        break;
      case 'America/Los_Angeles':
        date += ':00.000-0800';
        break;
      case 'US/Hawaii':
        date += ':00.000-1000';
        break;
      case 'Japan':
        date += ':00.000+0900';
        break;
      case 'Asia/Bahrain':
        date += ':00.000+0300';
        break;
      case 'UTC':
      default:
        date += ':00.000';
        break;
    }

    console.log(date);

    this.utcDate = new Date(date);
  }

  ngOnInit(): void {
    const subscription = this.connectionRepository.checkConnection().subscribe({
      next: () => {
        this.backendConnected = true;
      },
      error: (error) => {
        this.backendConnected = false;
        console.error(error);
      },
      complete: () => subscription && subscription.unsubscribe(),
    });

    this.formGroup?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.formUpdated();
    });
  }

  toggleImportData() {
    this.importData = !this.importData;
  }

  onDateTimeChange(event: Event | string): void {
    let newValue: string;
    if (typeof event !== 'string') {
      const target = event.target as HTMLInputElement;
      newValue = target.value;
    } else {
      newValue = event;
    }

    const stringDate = new Date(newValue).toISOString().slice(0, 23);
    console.log(stringDate);
    const subscription = this.conversionRepository
      .putNewStartDate(stringDate)
      .subscribe({
        next: () =>
          this.toastService.showSuccessMessage('New start date updated'),
        error: (error: HttpErrorResponse) => {
          console.log(error);
          this.toastService.showErrorMessage(
            'Failed to set new start date',
            error.error,
          );
        },
        complete: () => subscription && subscription.unsubscribe(),
      });
  }

  selectedFile: File | null = null;

  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.fileState =
        this.selectedFile?.type == 'text/csv' ? 'VALID' : 'INVALID';
    }
  }

  uploadAndConvert() {
    if (this.selectedFile) {
      this.fileState = 'WAITING_FOR_CONVERSION';

      this.loadingService.initiateLoadingScreen('Converting File...');

      this.conversionRepository
        .postConvertFile(this.selectedFile)
        .then((observable) => {
          const subscription = observable.subscribe({
            next: (fileContent) => {
              this.fileState = 'COMPLETE';
              const blob = new Blob([fileContent], {
                type: 'text/csv;charset=utf-8;',
              });

              const newFileName = `${this.selectedFile!.name.split('.csv')[0]}-modified-${this.newStartTimeFile}`;

              saveAs(blob, newFileName);
            },
            error: (error: HttpErrorResponse) => {
              console.log(error);
              this.fileState = 'ERROR_CONVERTING';
              this.toastService.popErrorToast(
                'Failed to convert file',
                error.error,
              );
            },
            complete: () => {
              this.loadingService.closeLoadingScrean();
              subscription && subscription.unsubscribe();
            },
          });
        });
    }
  }
}
