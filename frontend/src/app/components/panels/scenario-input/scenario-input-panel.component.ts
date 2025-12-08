import { Component, inject, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  faAdd,
  faDownload,
  faInfoCircle,
  faTable,
  faTrash,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { ButtonModule } from 'primeng/button';
import { CardComponent, ICON_FUNCTION } from '../../cards/card.component';
import { PlatformCardComponent } from '../../cards/platform/platform-card.component';
import { DialogConfirmationService } from '../../../services/dialog-confirmation.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  formGroupPlatformToPlatformType,
  getNewPlatformFormGroup,
} from '../../../shared/create';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DialogEditorService } from '../../../services/dialog-editor.service';
import { Platform } from '../../../../generated/platform';

@UntilDestroy()
@Component({
  selector: 'app-scenario-input-panel',
  imports: [
    ButtonModule,
    CardComponent,
    PlatformCardComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgIf,
    NgFor,
  ],
  templateUrl: './scenario-input-panel.component.html',
  styleUrl: './scenario-input-panel.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class ScenarioInputPanelComponent {
  @Input() scenarioInput!: FormGroup;
  @Input() onSubmit!: () => void;
  @Input() formUpdated!: () => void;
  addIcon = faAdd;
  trashIcon = faTrash;
  tableIcon = faTable;
  exportIcon = faUpload;
  importIcon = faDownload;
  infoIcon = faInfoCircle;

  platformIcons: Array<ICON_FUNCTION>;
  infoIcons: Array<ICON_FUNCTION>;

  private confirmationService = inject(DialogConfirmationService);
  private dialogService = inject(DialogEditorService);
  shouldShowWaypointTableRows: boolean = true;

  constructor(private fb: FormBuilder) {
    this.infoIcons = [
      {
        icon: this.infoIcon,
        type: 'NONE',
        tooltip: 'Edit scenario metadata',
        onClick: () => {
          this.dialogService.showMetadataDialog();
        },
      },
    ];

    this.platformIcons = [
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
            () => this.removeAllPlatforms(),
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

  onUpdated(): void {
    this.formUpdated();
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
    this.platforms.push(getNewPlatformFormGroup(this.fb, name, platform));
    this.formUpdated();
  }

  duplicatePlatform(index: number) {
    this.addPlatform(
      formGroupPlatformToPlatformType({ ...this.platforms.value[index] }),
    );
  }

  removeAllPlatforms() {
    this.platforms.clear();
  }

  removePlatform(index: number) {
    this.confirmationService.confirmAction(
      () => this.platforms.removeAt(index),
      () => {},
      `Are you sure you want to delete platform ${this.platforms.at(index)?.value.name} from this scenario?`,
      `Delete ${this.platforms.at(index)?.value.name} Confirmation`,
      `Delete ${this.platforms.at(index)?.value.name}`,
      `Platform ${this.platforms.at(index)?.value.name} successfully removed from scenario`,
    );
  }
}
