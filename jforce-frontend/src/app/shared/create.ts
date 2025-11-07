import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Platform, Waypoint } from './types';

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
    friendly: new FormControl(platform?.friendly ?? true, {
      validators: Validators.required,
    }),
    waypoints: fb.array(
      platform?.waypoints.map((waypoint: Waypoint) =>
        fb.group({
          lat: new FormControl(waypoint.lat, {
            validators: Validators.required,
          }),
          lon: new FormControl(waypoint.lon, {
            validators: Validators.required,
          }),
          alt: new FormControl(waypoint.alt, {
            validators: Validators.required,
          }),
          datetime: new FormControl(waypoint.datetime, {
            validators: Validators.required,
          }),
          index: new FormControl(waypoint.index, {
            validators: Validators.required,
          }),
          speedKts: new FormControl(waypoint.speedKts, {
            validators: Validators.required,
          }),
        }),
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
