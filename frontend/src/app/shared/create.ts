import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  createFormDateString,
  createISODateFromFormString,
  getWaypointIdFormat,
  platformTypeEnumToString,
  stringToPlatformTypeEnum,
} from './utils';
import { Waypoint, Platform } from '../../generated/platform';

export function getNewPlatformFormGroup(
  fb: FormBuilder,
  platformName: string,
  platform?: Platform,
  platformId?: string,
): FormGroup {
  const compliantPlatformId = (platformId ?? platformName)
    .replace(' ', '-')
    .toLowerCase();

  return fb.group({
    id: new FormControl(compliantPlatformId, {
      validators: Validators.required,
    }), // TODO make better id,
    name: new FormControl(platform?.name ?? platformName, {
      validators: Validators.required,
    }),
    maxSpeed: new FormControl(platform?.maxSpeed ?? '', {
      validators: Validators.required,
    }),
    maxZ: new FormControl(platform?.maxZ ?? '', {
      validators: Validators.required,
    }),
    type: new FormControl(
      platform?.type ? platformTypeEnumToString(platform.type) : 'AIR',
      {
        validators: Validators.required,
      },
    ),
    color: new FormControl(platform?.color ?? '#6BAED6', {
      validators: Validators.required,
    }),
    friendly: new FormControl(platform?.friendly ?? true, {
      validators: Validators.required,
    }),
    reportingFrequency: new FormControl(platform?.reportingFrequency ?? 0, {
      validators: Validators.required,
    }),
    readonly: new FormControl(platform?.readonly ?? false, {
      validators: Validators.required,
    }), // TODO change to be dynamic once they can add platforms from a predesigned list
    waypoints: fb.array(
      platform?.waypoints.map((waypoint: Waypoint, i: number) =>
        createNewWaypointFormGroup(fb, compliantPlatformId, i, waypoint),
      ) ?? [],
    ),
  });
}

export function createNewWaypointFormGroup(
  fb: FormBuilder,
  platformId: string,
  waypointIndex?: number,
  waypoint?: Waypoint,
): FormGroup {
  return fb.group({
    Id: new FormControl(getWaypointIdFormat(platformId, waypointIndex ?? 0), {
      validators: Validators.required,
    }),
    lat: new FormControl(waypoint?.lat ?? 0, {
      validators: Validators.required,
    }),
    lon: new FormControl(waypoint?.lon ?? 0, {
      validators: Validators.required,
    }),
    z: new FormControl(waypoint?.z ?? 0, {
      validators: Validators.required,
    }),
    datetimeUTC: new FormControl(
      waypoint?.datetimeUTC ?? createFormDateString(new Date()),
      {
        validators: Validators.required,
      },
    ),
    index: new FormControl(waypointIndex ?? waypoint?.index ?? 0, {
      validators: Validators.required,
    }),
    speedKts: new FormControl(waypoint?.speedKts ?? 0, {
      validators: Validators.required,
    }),
    smaj: new FormControl(waypoint?.smaj ?? 0, {
      validators: Validators.required,
    }),
    smin: new FormControl(waypoint?.smin ?? 0, {
      validators: Validators.required,
    }),
    orientation: new FormControl(waypoint?.orientation ?? 0, {
      validators: Validators.required,
    }),
  });
}

export function formGroupPlatformsToPlatformArray(platforms: any): Platform[] {
  return platforms
    ? platforms.map((platform: any) => {
        return formGroupPlatformToPlatformType(platform);
      })
    : [];
}

export function formGroupPlatformToPlatformType(platform: any): Platform {
  return {
    ...platform,
    type: stringToPlatformTypeEnum(platform.type),
    waypoints: formGroupWaypointToWaypointArray(platform.waypoints),
  };
}

export function formGroupWaypointToWaypointArray(waypoints: any): Waypoint[] {
  return waypoints
    ? waypoints.map((waypoint: any) => {
        return formGroupWaypointToWaypointType(waypoint);
      })
    : [];
}

export function formGroupWaypointToWaypointType(waypoint: any): Waypoint {
  return {
    ...waypoint,
    datetime: new Date(createISODateFromFormString(waypoint.datetime)),
  };
}
