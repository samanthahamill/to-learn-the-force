import {
  Component,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserStateService } from '../../../services/user-state.service';
import { PlatformComponent } from '../../cards/platform/platform.component';
import { ToolsComponent } from '../../cards/tools/tools.component';
import { CommonModule, NgIf } from '@angular/common';
import { ToastService } from '../../../services/toast.service';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-input-panel',
  imports: [
    PlatformComponent,
    ToolsComponent,
    CommonModule,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './input-panel.component.html',
  styleUrl: './input-panel.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class InputPanelComponent {
  @Input() formGroup!: FormGroup;
  @Input() onSubmit!: () => void;
  importIcon = faUpload;
  exportIcon = faDownload;

  constructor() {}
}
