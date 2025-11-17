import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Platform, Waypoint } from './types';
import { createWaypointId } from './utils';

export function getNewPlatformFormGroup(
  fb: FormBuilder,
  platformName: string,
  platform?: Platform,
): FormGroup {
  // TODO implement
  return fb.group({
    name: new FormControl(platform?.name ?? platformName, {
      validators: Validators.required,
    }),
    id: new FormControl(platformName, { validators: Validators.required }), // TODO make better id,
    maxSpeed: new FormControl(platform?.maxSpeed ?? '', {
      validators: Validators.required,
    }),
    maxAlt: new FormControl(platform?.maxAlt ?? '', {
      validators: Validators.required,
    }),
    maxDepth: new FormControl(platform?.maxDepth ?? '', {
      validators: Validators.required,
    }),
    type: new FormControl(platform?.type ?? 'AIR', {
      validators: Validators.required,
    }),
    color: new FormControl(platform?.color ?? '#6BAED6', {
      validators: Validators.required,
    }),
    friendly: new FormControl(platform?.friendly ?? true, {
      validators: Validators.required,
    }),
    waypoints: fb.array(
      platform?.waypoints.map((waypoint: Waypoint) =>
        createNewWaypoint(fb, platform.name, waypoint.index, waypoint),
      ) ?? [],
    ),
    reportingFrequency: new FormControl(platform?.reportingFrequency ?? 0, {
      validators: Validators.required,
    }),
    readonly: new FormControl(platform?.readonly ?? false, {
      validators: Validators.required,
    }), // TODO change to be dynamic once they can add platforms from a predesigned list
  });
}

export function createNewWaypoint(
  fb: FormBuilder,
  platformName: string,
  waypointIndex?: number,
  waypoint?: Waypoint,
) {
  return fb.group({
    id: new FormControl(
      waypoint?.id ?? `${platformName}-waypoint-${waypointIndex}`,
      {
        validators: Validators.required,
      },
    ),
    lat: new FormControl(waypoint?.lat ?? 0, {
      validators: Validators.required,
    }),
    lon: new FormControl(waypoint?.lon ?? 0, {
      validators: Validators.required,
    }),
    alt: new FormControl(waypoint?.alt ?? 0, {
      validators: Validators.required,
    }),
    datetime: new FormControl(waypoint?.datetime ?? new Date().toISOString(), {
      validators: Validators.required,
    }),
    index: new FormControl(waypointIndex ?? waypoint?.index ?? 0, {
      validators: Validators.required,
    }),
    speedKts: new FormControl(waypoint?.speedKts ?? 0, {
      validators: Validators.required,
    }),
  });
}
