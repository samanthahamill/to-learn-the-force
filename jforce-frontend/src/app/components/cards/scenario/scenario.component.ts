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
import { PlatformComponent } from '../platform/platform.component';
import { DialogConfirmationService } from '../../../services/dialog-confirmation.service';
import { InfoCardComponent } from '../info/info-card.component';

@Component({
  selector: 'app-scenario-card',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardComponent,
    PlatformComponent,
    InfoCardComponent,
    NgIf,
    NgFor,
  ],
  templateUrl: './scenario.component.html',
  styleUrl: './scenario.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class ScenarioComponent {
  @Input() scenarioInfo!: FormGroup;
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
    return this.scenarioInfo.get('platforms') as FormArray;
  }

  get platformCount(): number {
    return (this.platforms?.value as Array<Platform>).length ?? 0;
  }

  // In your component class
  get formGroups(): FormGroup[] {
    return (this.platforms?.controls as FormGroup[]) ?? [];
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
