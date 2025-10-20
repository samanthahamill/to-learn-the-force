import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { ButtonModule } from 'primeng/button';
import { Platform } from '../../../shared/types';
import { CardComponent } from '../card.component';

@Component({
  selector: 'app-scenario-card',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardComponent,
  ],
  templateUrl: './scenario.component.html',
  styleUrl: './scenario.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class ScenarioComponent {
  @Input() scenarioInfo!: FormGroup;
  addIcon = faAdd;

  constructor(private fb: FormBuilder) {}

  get platforms(): FormArray {
    return this.scenarioInfo.get('platforms') as FormArray;
  }

  get platformCount(): number {
    return (this.scenarioInfo.get('platforms') as FormArray)?.value?.size ?? 0;
  }

  private getNewPlatformName() {
    let newIndex = this.platforms.value.size ?? 0;
    let foundName = false;
    let newName = `Platform ${newIndex}`;

    while (!foundName) {
      if (
        !(this.platforms.value.value as Array<Platform>)
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
      this.fb.control({
        name: name,
        id: name, // TODO make better id
      } as Platform),
    );
  }

  removePlatform(index: number) {
    // TODO implement
  }
}
