import {
  Component,
  EventEmitter,
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
} from '@angular/forms';
import { CommonModule, NgClass, NgFor } from '@angular/common';
import {
  faCopy,
  faGear,
  faLock,
  faLockOpen,
  faRemove,
} from '@fortawesome/free-solid-svg-icons';
import { PLATFORM_TYPE, Waypoints } from '../../../shared/types';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-platform-card',
  imports: [
    CommonModule,
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    NgClass,
  ],
  templateUrl: './platform-card.component.html',
  styleUrl: './platform-card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlatformCardComponent implements OnInit {
  removeIcon = faRemove;
  copyIcon = faCopy;
  gearIcon = faGear;
  lockIcon = faLock;
  lockOpenIcon = faLockOpen;

  @Input() platformForm!: FormGroup;
  @Input() index!: number;
  @Output() onDeleteClicked = new EventEmitter<void>();
  name: string = '';
  readonly: boolean = false;
  waypointsLocked: boolean = false;

  platformTypeOptions: Array<PLATFORM_TYPE> = ['AIR', 'GROUND', 'MARITIME'];

  icons: Array<ICON_FUNCTION>;

  constructor() {
    this.icons = [
      {
        icon: faRemove,
        type: 'DELETE',
        tooltip: 'Delete Platform',
        onClick: () => this.onDeleteClicked.emit(),
      },
    ];
  }

  get waypoints(): Waypoints[] {
    return (
      ((this.platformForm.get('waypoints') as FormArray)
        ?.value as Waypoints[]) ?? []
    );
  }

  ngOnInit(): void {
    this.name = this.platformForm.get('name')?.value ?? 'Platform';
    const readonly = this.platformForm.get('readonly')?.value;
    if (readonly !== undefined) {
      this.readonly = readonly;
    }
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

  nameUpdated() {
    this.name = this.platformForm.get('name')?.value ?? 'Platform';
  }

  shiftWaypoints() {
    this.waypoints.forEach((waypoint, i) => (waypoint.index = i));
  }
}
