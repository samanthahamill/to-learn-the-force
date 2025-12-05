import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import { CardComponent, ICON_FUNCTION } from '../card.component';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import {
  faCopy,
  faEdit,
  faLock,
  faLockOpen,
  faRemove,
} from '@fortawesome/free-solid-svg-icons';
import {
  PLATFORM_TYPE,
  PLATFORM_TYPE_OPTIONS,
  Waypoint,
} from '../../../shared/types';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { createNewWaypointId } from '../../../shared/utils';
import { DialogEditorService } from '../../../services/dialog-editor.service';

@UntilDestroy()
@Component({
  selector: 'app-platform-card',
  imports: [
    CommonModule,
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    FontAwesomeModule,
    NgClass,
    NgFor,
    NgIf,
  ],
  templateUrl: './platform-card.component.html',
  styleUrl: './platform-card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlatformCardComponent implements AfterViewInit {
  removeIcon = faRemove;
  copyIcon = faCopy;
  editIcon = faEdit;
  lockIcon = faLock;
  lockOpenIcon = faLockOpen;

  @Input() platformForm!: FormGroup;
  @Input() index!: number;
  @Input() shouldShowWaypointTableRows!: boolean;
  @Input() formUpdated!: () => void;
  @Output() onDeleteClicked = new EventEmitter<void>();
  @Output() onCopyClicked = new EventEmitter<void>();
  @Output() onEditClicked = new EventEmitter<void>(); // TODO implement

  waypointsLocked: boolean = false;

  type: PLATFORM_TYPE | undefined = undefined;
  platformTypeOptions = PLATFORM_TYPE_OPTIONS;
  icons: Array<ICON_FUNCTION>;
  defaultColor: string | undefined = undefined; // default color at the time the platform was made

  private dialogEditorService = inject(DialogEditorService);

  constructor() {
    this.icons = [
      {
        icon: faEdit,
        type: 'NONE',
        tooltip: 'Edit Platform',
        onClick: () => this.editPlatformClicked(),
      },
      {
        icon: faCopy,
        type: 'NONE',
        tooltip: 'Copy Platform',
        onClick: () => this.onCopyClicked.emit(),
      },
      {
        icon: faRemove,
        type: 'DELETE',
        tooltip: 'Delete Platform',
        onClick: () => this.onDeleteClicked.emit(),
      },
    ];
  }
  get waypoints(): Waypoint[] {
    return (
      ((this.platformForm?.get('waypoints') as FormArray)
        ?.value as Waypoint[]) ?? []
    );
  }

  get id(): string | undefined {
    return this.platformForm?.get('id')?.value;
  }

  get name(): string {
    return this.platformForm?.get('name')?.value ?? 'Unknown';
  }

  get platformType(): PLATFORM_TYPE {
    return this.platformForm?.get('type')?.value;
  }

  get readonly(): boolean {
    return this.platformForm?.get('readonly')?.value;
  }

  getDateTimeString(date: Date) {
    console.log(date);
    return date?.toISOString() ?? '';
  }

  ngAfterViewInit(): void {
    this.platformForm?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const type = this.platformForm?.controls['type'].value as PLATFORM_TYPE;

      this.platformForm.controls['maxZ'].clearValidators();

      const color = this.platformForm?.get('color')?.value;
      if (
        this.defaultColor === undefined &&
        color !== undefined &&
        color !== this.defaultColor
      ) {
        this.defaultColor = color;
      }

      if (type != 'GROUND') {
        this.platformForm.controls['maxZ'].setValidators(Validators.required);
      }

      this.type = type;
    });

    this.platformForm
      ?.get('type')
      ?.setValue(this.platformForm?.get('type')?.value ?? 'AIR');
  }

  onUpdate(): void {
    this.formUpdated();
  }

  onColorChange(color: string): void {
    if (color !== this.platformForm?.controls['color']?.value) {
      this.platformForm?.controls['color']?.setValue(color);
      this.formUpdated();
    }
  }

  getWaypointCount(): number {
    return this.waypoints.length ?? 0;
  }

  deleteWaypoint(index: number) {
    this.waypoints.splice(index, 1);
    this.shiftWaypoints();
  }

  drop(event: CdkDragDrop<string[]>) {
    const waypoints = this.waypoints;
    moveItemInArray(waypoints, event.previousIndex, event.currentIndex);
    // TODO add other logic that fixes drag/drop with times

    this.shiftWaypoints();
  }

  duplicateWaypoint(index: number) {
    const duplicateWaypoint = {
      ...this.waypoints[index],
      id: createNewWaypointId(
        this.id ?? this.name ?? 'platform',
        this.waypoints,
      ),
    };
    this.waypoints.splice(index, 0, duplicateWaypoint);
    this.shiftWaypoints();
  }

  lockClicked() {
    this.waypointsLocked = !this.waypointsLocked;
  }

  editPlatformClicked() {
    this.dialogEditorService.updatePlatformAndOpenDialog(this.index);
  }

  shiftWaypoints() {
    this.waypoints.forEach((waypoint, i) => (waypoint.index = i));
    this.formUpdated();
  }
}
