import { Component, inject, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  WaypointEditorInformation,
  WaypointEditorService,
} from '../../../services/waypoint-editor.service';
import { UserStateService } from '../../../services/user-state.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Waypoint } from '../../../shared/types';
import { WaypointEditorComponent } from '../../cards/waypoint-editor/waypoint-editor.component';
import { deepClone } from '../../../shared/utils';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-waypoint-dialog',
  imports: [
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    WaypointEditorComponent,
  ],
  templateUrl: './waypoint-dialog.component.html',
  styleUrl: './waypoint-dialog.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class WaypointDialogComponent implements OnInit {
  waypointPlatformData: WaypointEditorInformation | undefined;
  waypointEditorService = inject(WaypointEditorService);
  userStateService = inject(UserStateService);
  theresAnError: boolean = false;
  errorMessage: string | undefined;

  constructor() {}

  get waypoints(): Waypoint[] {
    return this.waypointPlatformData?.waypoints ?? [];
  }

  get platformName(): string {
    return this.waypointPlatformData?.platform.name ?? '';
  }

  ngOnInit() {
    this.waypointEditorService.waypointInformation$
      .pipe(untilDestroyed(this))
      .subscribe((info: WaypointEditorInformation | undefined) => {
        if (info !== undefined) {
          this.waypointPlatformData = {
            waypoints: deepClone(info.waypoints),
            platform: {
              ...info.platform,
              waypoints: deepClone(info.platform.waypoints),
            },
            platformIndex: info.platformIndex,
          };

          this.openModal();
        }
      });
  }

  openModal() {
    $('#waypointModal').modal('show');
  }

  closeModal() {
    $('#waypointModal').modal('hide');
  }

  updateOnModelClose(): void {
    if (this.waypointPlatformData) {
      this.userStateService.updateWaypoint(
        this.waypointPlatformData.platformIndex,
        this.waypoints,
      );
    }

    this.closeModal();
  }

  waypointPlatformDataUpdated(waypointPlatformData: WaypointEditorInformation) {
    this.waypointPlatformData = waypointPlatformData;
  }

  closeAndSaveModal() {
    const error = this.validateWaypointValues();

    if (error !== '') {
      this.theresAnError = true;
      this.errorMessage = error;
    } else {
      this.theresAnError = false;
      this.updateOnModelClose();
    }
  }

  validateWaypointValues(): string {
    if (this.waypointPlatformData?.waypoints == undefined) return '';

    for (const waypoint of this.waypointPlatformData?.waypoints) {
      if (
        waypoint === null ||
        waypoint.id == null ||
        waypoint.alt == null ||
        waypoint.lat == null ||
        waypoint.lon == null ||
        waypoint.datetime == null ||
        waypoint.speedKts == null
      ) {
        return 'Some form values were incorrect. Make sure everything is filled out before saving changes';
      }
    }

    return '';
  }
}
