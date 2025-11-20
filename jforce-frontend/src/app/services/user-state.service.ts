import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';
import {
  AOIType,
  METADATA,
  Platform,
  UserInputFormData,
  Waypoint,
} from '../shared/types';
import { addHours, minusHours } from '../shared/utils';
import { FormGroup } from '@angular/forms';
import { createFormDateString } from '../shared/create';

const BASIC_FORM_DATA: UserInputFormData = {
  metadata: {
    scenarioAuthor: 'TBD',
    dateOfCreation: new Date(),
    details: '',
  },
  scenarioInput: {
    scenarioName: 'Test Scenario',
    startTime: minusHours(new Date(), 48),
    endTime: new Date(),
    aoi: {
      lat: 0,
      lon: 0,
      alt: 0,
      radius: 450,
    },
    platforms: [
      {
        name: 'Test',
        id: 'test',
        readonly: false,
        maxSpeed: 0,
        maxZ: 0,
        type: 'AIR',
        reportingFrequency: 0,
        friendly: true,
        color: '#6466f1',
        waypoints: [
          {
            id: 'test-waypoint-0',
            lat: 2,
            lon: 2,
            z: 1,
            datetime: minusHours(new Date(), 22),
            index: 0,
            speedKts: 13,
          },
          {
            id: 'test-waypoint-1',
            lat: 1,
            lon: 1,
            z: 1,
            datetime: minusHours(new Date(), 17),
            index: 1,
            speedKts: 13,
          },
          {
            id: 'test-waypoint-2',
            lat: 1,
            lon: 0,
            z: 1,
            datetime: minusHours(new Date(), 10),
            index: 2,
            speedKts: 13,
          },
        ],
      },
      {
        name: 'Second Test',
        id: 'second-test',
        readonly: false,
        maxSpeed: 0,
        maxZ: 0,
        type: 'GROUND',
        reportingFrequency: 0,
        friendly: true,
        color: '#51e68fff',
        waypoints: [
          {
            id: 'second-test-waypoint-0',
            lat: 3,
            lon: 1,
            z: 1,
            datetime: new Date(),
            index: 0,
            speedKts: 13,
          },
          {
            id: 'second-test-waypoint-1',
            lat: 2,
            lon: 3,
            z: 1,
            datetime: addHours(new Date(), 10),
            index: 1,
            speedKts: 13,
          },
          {
            id: 'second-test-waypoint-2',
            lat: 2,
            lon: 4,
            z: 1,
            datetime: addHours(new Date(), 4),
            index: 2,
            speedKts: 13,
          },
        ],
      },
    ],
  },
};

interface UserStoreState {
  input: UserInputFormData | undefined;
  aoi: AOIType | undefined;
  maxDate: string;
  minDate: string;
}

export interface ChangeAOIRequest {
  centerLat: number;
  centerLon: number;
  radius: number;
}

const store = createStore(
  { name: 'user-state' },
  withProps<UserStoreState>({
    input: BASIC_FORM_DATA,
    aoi: undefined,
    maxDate: createFormDateString(new Date()),
    minDate: createFormDateString(minusHours(new Date(), 48)),
  }),
);

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  input$ = store.pipe(select((state) => state.input));
  aoi$ = store.pipe(select((state) => state.aoi));
  maxDate$ = store.pipe(select((state) => state.maxDate));
  minDate$ = store.pipe(select((state) => state.minDate));

  constructor() {
    store.update((state) => ({
      ...state,
      input: BASIC_FORM_DATA,
      aoi: BASIC_FORM_DATA.scenarioInput.aoi,
    }));
  }

  get getAOI() {
    return store.value.aoi;
  }

  get platformLength() {
    return store.value.input?.scenarioInput?.platforms?.length ?? 0;
  }

  get minDate() {
    return store.value.minDate;
  }

  get maxDate() {
    return store.value.maxDate;
  }

  get metadata() {
    return store.value.input?.metadata;
  }

  updateInput(input: UserInputFormData) {
    store.update((state) => ({
      ...state,
      minDate: createFormDateString(input.scenarioInput.startTime),
      maxDate: createFormDateString(input.scenarioInput.endTime),
      input: input,
      aoi:
        input?.scenarioInput?.aoi ??
        state.aoi ??
        BASIC_FORM_DATA.scenarioInput.aoi,
    }));
  }

  updateMetadata(metadata: METADATA) {
    store.update((state) => ({
      ...state,
      input: {
        ...state.input!,
        metadata: {
          ...metadata,
          dateOfCreation: metadata.dateOfCreation,
        },
      },
    }));
  }

  addPlatform(platform: FormGroup) {
    store.update((state) => ({
      ...state,
      scenarioInput: {
        ...state.input!.scenarioInput,

        platforms: state.input!.scenarioInput!.platforms
          ? [...state.input!.scenarioInput.platforms, platform.value]
          : [platform.value],
      },
      aoi:
        state.input?.scenarioInput?.aoi ??
        state.aoi ??
        BASIC_FORM_DATA.scenarioInput.aoi,
    }));
  }

  updateAOIRequest(aoi: ChangeAOIRequest) {
    // TODO implement
    this.updateAOI({
      lat: aoi.centerLat,
      lon: aoi.centerLon,
      radius: aoi.radius,
      alt: 0.0,
    });
  }

  updateAOI(newAoi: AOIType) {
    const aoi = store.value.aoi;
    if (
      newAoi.lat !== undefined &&
      newAoi.lon !== undefined &&
      newAoi.alt !== undefined &&
      newAoi.radius !== undefined &&
      (aoi === undefined ||
        newAoi.alt != aoi.alt ||
        newAoi.lat != aoi.lat ||
        newAoi.lon != aoi.lon ||
        newAoi.radius != aoi.radius)
    ) {
      store.update((state) => ({
        ...state,
        aoi: newAoi as AOIType,
        input: state.input
          ? {
              ...state.input,
              scenarioInput: {
                ...state.input?.scenarioInput,
                aoi: newAoi,
              },
            }
          : undefined,
      }));
    }
  }

  updateWaypoint(platformIndex: number, waypointInfo: Waypoint[]) {
    if (platformIndex !== undefined && waypointInfo !== undefined) {
      const inputValue = store.value.input;

      const platforms = inputValue?.scenarioInput.platforms;
      if (platforms !== undefined) {
        platforms[platformIndex].waypoints = waypointInfo;

        store.update((state) => ({
          ...state,
          input:
            state.input == undefined
              ? undefined
              : {
                  // TODO fix me... trying to update waypoints
                  ...state.input,
                  scenarioInput: {
                    ...state.input.scenarioInput,
                    platforms: platforms,
                  },
                },
        }));
      }
    }
  }

  updatePlatform(platformIndex: number, platformInfo: Platform) {
    if (platformIndex !== undefined && platformInfo !== undefined) {
      const inputValue = store.value.input;

      const platforms = inputValue?.scenarioInput.platforms;
      if (platforms !== undefined) {
        platforms[platformIndex] = platformInfo;

        store.update((state) => ({
          ...state,
          input:
            state.input == undefined
              ? undefined
              : {
                  // TODO fix me... trying to update waypoints
                  ...state.input,
                  scenarioInput: {
                    ...state.input.scenarioInput,
                    platforms: platforms,
                  },
                },
        }));
      }
    }
  }
}
