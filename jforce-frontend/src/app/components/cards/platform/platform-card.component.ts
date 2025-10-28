import {
  Component,
  EventEmitter,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
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
  faLock,
  faLockOpen,
  faPencil,
  faRemove,
} from '@fortawesome/free-solid-svg-icons';
import { PLATFORM_TYPE, Waypoint } from '../../../shared/types';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WaypointEditorService } from '../../../services/waypoint-editor.service';

@UntilDestroy()
@Component({
  selector: 'app-platform-card',
  imports: [
    CommonModule,
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
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
export class PlatformCardComponent implements OnInit {
  removeIcon = faRemove;
  copyIcon = faCopy;
  editIcon = faPencil;
  lockIcon = faLock;
  lockOpenIcon = faLockOpen;

  @Input() platformForm!: FormGroup;
  @Input() index!: number;
  @Input() shouldShowWaypointTableRows!: boolean;

  @Output() onDeleteClicked = new EventEmitter<void>();
  @Output() onCopyClicked = new EventEmitter<void>();

  waypointsLocked: boolean = false;

  platformTypeOptions: Array<PLATFORM_TYPE> = ['AIR', 'GROUND', 'MARITIME'];

  icons: Array<ICON_FUNCTION>;

  private waypointEditorService = inject(WaypointEditorService);

  constructor() {
    this.icons = [
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
      ((this.platformForm.get('waypoints') as FormArray)
        ?.value as Waypoint[]) ?? []
    );
  }

  get name(): string {
    return this.platformForm.get('name')?.value;
  }

  get platformType(): PLATFORM_TYPE {
    return this.platformForm.get('type')?.value;
  }

  get readonly(): boolean {
    return this.platformForm.get('readonly')?.value;
  }

  ngOnInit(): void {
    this.platformForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        const type = this.platformForm?.controls['type'].value as PLATFORM_TYPE;

        // if (this.platformType != type) {
        //   this.platformType = type;
        // }
        this.platformForm.controls['depth'].clearValidators();
        this.platformForm.controls['alt'].clearValidators();

        if (type == 'MARITIME') {
          this.platformForm.controls['depth'].setValidators(
            Validators.required,
          );
        } else if (type == 'AIR') {
          this.platformForm.controls['alt'].setValidators(Validators.required);
        }
      });
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
    const duplicateWaypoint = { ...this.waypoints[index] };
    this.waypoints.splice(index, 0, duplicateWaypoint);
    this.shiftWaypoints();
  }

  gearClicked() {
    // create popup
  }

  lockClicked() {
    this.waypointsLocked = !this.waypointsLocked;
  }

  openModal() {
    this.waypointEditorService.updateWaypointAndOpenDialog(
      this.waypoints,
      this.name,
      this.index,
    );
  }

  // nameUpdated() {
  //   this.name = this.platformForm.get('name')?.value ?? 'Platform';
  // }

  shiftWaypoints() {
    this.waypoints.forEach((waypoint, i) => (waypoint.index = i));
  }
}
