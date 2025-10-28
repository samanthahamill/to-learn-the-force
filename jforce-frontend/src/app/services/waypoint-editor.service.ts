import { inject, Injectable } from '@angular/core';
import { Waypoint } from '../shared/types';
import { createStore, select, withProps } from '@ngneat/elf';
import { UserStateService } from './user-state.service';
import { FormArray, FormGroup } from '@angular/forms';

export interface WaypointEditorInformation {
  waypoints: Waypoint[];
  platformName: string;
  platformIndex: number;
}

interface WaypointState {
  waypointInformation: WaypointEditorInformation | undefined;
}

const store = createStore(
  { name: 'waypoint-state' },
  withProps<WaypointState>({
    waypointInformation: undefined,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class WaypointEditorService {
  waypointInformation$ = store.pipe(
    select((state) => state.waypointInformation),
  );

  userStateService = inject(UserStateService);

  constructor() {}

  updateWaypointAndOpenDialog(
    waypoints: Waypoint[],
    platformName: string,
    platformIndex: number,
  ) {
    const info = {
      waypoints: waypoints,
      platformName: platformName,
      platformIndex: platformIndex,
    };
    store.update((state) => ({
      ...state,
      waypointInformation: info,
    }));
  }

  saveUpdatedInformation() {
    const waypointInfo = store.value.waypointInformation;

    if (waypointInfo !== undefined) {
      this.userStateService.updateWaypoint(
        waypointInfo.platformIndex,
        waypointInfo.waypoints as Waypoint[],
      );
    }
  }
}
