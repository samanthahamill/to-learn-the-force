import {
  Component,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { faAdd, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ButtonModule } from 'primeng/button';
import { Platform } from '../../../shared/types';
import { CardComponent, ICON_FUNCTION } from '../card.component';
import { PlatformCardComponent } from '../platform/platform-card.component';
import { DialogConfirmationService } from '../../../services/dialog-confirmation.service';
import { AoiCardComponent } from '../aoi/aoi-card.component';

@Component({
  selector: 'app-scenario-input-card',
  imports: [
    ButtonModule,
    CardComponent,
    PlatformCardComponent,
    AoiCardComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
  ],
  templateUrl: './scenario-input-card.component.html',
  styleUrl: './scenario-input-card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class ScenarioInputCardComponent {
  @Input() scenarioInput!: FormGroup;
  addIcon = faAdd;
  trashIcon = faTrash;

  icons: Array<ICON_FUNCTION>;

  private confirmationService = inject(DialogConfirmationService);

  constructor(private fb: FormBuilder) {
    this.icons = [
      {
        icon: this.trashIcon,
        type: 'DELETE',
        tooltip: 'Delete All Platforms',
        onClick: () =>
          this.confirmationService.confirmAction(
            this.removeAllPlatforms,
            () => {},
            'Are you sure you want to delete all platforms from this scenario?',
            'Delete All Platforms Confirmation',
            'Delete All Platforms',
            'All platforms successfully removed from scenario',
          ),
      },
    ];
  }

  get platforms(): FormArray {
    return this.scenarioInput.get('platforms') as FormArray;
  }

  get platformCount(): number {
    return (this.platforms?.value as Array<Platform>).length ?? 0;
  }

  // In your component class
  get formGroups(): FormGroup[] {
    return (this.platforms?.controls as FormGroup[]) ?? [];
  }

  getFormGroup(formGroup: string): FormGroup {
    return this.scenarioInput?.get(formGroup) as FormGroup;
  }

  private getNewPlatformName() {
    let newIndex = this.platforms.value.size ?? 0;
    let foundName = false;
    let newName = `Platform ${newIndex}`;

    if ((this.platforms?.value as Array<Platform>) === undefined) {
      return newName;
    }

    while (!foundName) {
      newName = `Platform ${newIndex}`;
      if (
        !(this.platforms?.value as Array<Platform>)
          .map((platform) => platform.name)
          .includes(newName)
      ) {
        foundName = true;
      } else {
        newIndex++;
      }
    }

    return newName;
  }

  addPlatform() {
    const name = this.getNewPlatformName();

    // TODO implement
    this.platforms.push(
      this.fb.group({
        name: [name, [Validators.required]],
        id: [name, [Validators.required]], // TODO make better id,
        speed: ['', [Validators.required]],
        type: ['AIR', [Validators.required]],
        waypoints: [this.fb.array([]), [Validators.required]],
        reportingFrequency: [0, [Validators.required]],
        readonly: false, // TODO change to be dynamic once they can add platforms from a predesigned list
      }),
    );
  }

  removeAllPlatforms() {
    this.platforms.clear();
  }

  removePlatform(index: number) {
    this.platforms.removeAt(index);
  }
}
