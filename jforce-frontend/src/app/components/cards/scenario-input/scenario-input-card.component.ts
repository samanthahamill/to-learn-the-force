import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { faAdd, faTable, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ButtonModule } from 'primeng/button';
import { Platform, Waypoint } from '../../../shared/types';
import { CardComponent, ICON_FUNCTION } from '../card.component';
import { PlatformCardComponent } from '../platform/platform-card.component';
import { DialogConfirmationService } from '../../../services/dialog-confirmation.service';
import { AoiCardComponent } from '../aoi/aoi-card.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { getNewPlatformFormGroup } from '../../../shared/create';
import { UserStateService } from '../../../services/user-state.service';

@UntilDestroy()
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
  @Input() formUpdated!: () => void;
  addIcon = faAdd;
  trashIcon = faTrash;
  tableIcon = faTable;

  icons: Array<ICON_FUNCTION>;

  private confirmationService = inject(DialogConfirmationService);
  private userStateService = inject(UserStateService);
  shouldShowWaypointTableRows: boolean = true;

  constructor(private fb: FormBuilder) {
    this.icons = [
      {
        icon: this.tableIcon,
        type: 'NONE',
        tooltip: 'Toggle Waypoint Table Visibility',
        onClick: () => {
          this.shouldShowWaypointTableRows = !this.shouldShowWaypointTableRows;
        },
      },
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

  onUpdated(): void {
    this.formUpdated();
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

  addPlatform(platform?: Platform) {
    const name = this.getNewPlatformName();

    // TODO implement
    this.platforms.push(getNewPlatformFormGroup(this.fb, name, platform));
    this.formUpdated();
  }

  duplicatePlatform(index: number) {
    this.addPlatform({ ...this.platforms.value[index] });
  }

  removeAllPlatforms() {
    this.platforms.clear();
  }

  removePlatform(index: number) {
    this.platforms.removeAt(index);
  }
}
