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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleNotch,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { ConversionRepository } from '../../../state/conversion.repository';
import { ToastService } from '../../../services/toast.service';
import { ConnectionRepository } from '../../../state/connection.repository';
import { LoadingService } from '../../../services/loading.service';

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

  // TODO set up actual connections

  constructor() {
    this.fileState = 'NOT_LOADED';
    this.importData = false;
    this.maxDateTime = this.systemStateService.maxDate;
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

  selectedFile: File | null = null;

  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.fileState = this.selectedFile?.name.endsWith('.csv')
        ? 'VALID'
        : 'INVALID';
    }
  }

  uploadAndConvert() {
    if (this.selectedFile) {
      this.fileState = 'WAITING_FOR_CONVERSION';

      this.loadingService.initiateLoadingScreen('Converting File...');

      const subscription = this.conversionRepository
        .postConvertFile(this.selectedFile, 0)
        .subscribe({
          next: (fileContent) => {
            // TODO convert
            this.fileState = 'COMPLETE';

            const blob = new Blob([fileContent], {
              type: 'text/csv;charset=utf-8;',
            });
          },
          error: (error) => {
            console.log(error);
            this.fileState = 'ERROR_CONVERTING';
            this.toastService.popErrorToast('Failed to convert file', error);
          },
          complete: () => {
            this.loadingService.closeLoadingScrean();
            subscription && subscription.unsubscribe();
          },
        });

      // setTimeout(() => {
      //   this.fileState = 'ERROR_CONVERTING';
      //   this.loadingService.closeLoadingScrean();
      // }, 5000);
    }
  }
}
