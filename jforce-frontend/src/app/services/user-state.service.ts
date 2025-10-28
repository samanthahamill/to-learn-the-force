import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';
import { AOIType, UserInputFormData, Waypoint } from '../shared/types';

const BASIC_FORM_DATA: UserInputFormData = {
  scenario: {
    baseInfo: {
      scenarioName: 'Test',
      scenarioAuthor: 'TBD',
      dateOfCreation: new Date(),
      details: '',
    },
    scenarioInput: {
      aoi: {
        lat: 0,
        lon: 0,
        alt: 0,
        radius: 10,
      },
      platforms: [
        {
          name: 'test',
          id: 'test',
          readonly: false,
          maxSpeed: 0,
          maxAlt: 0,
          maxDepth: 0,
          type: 'AIR',
          reportingFrequency: 0,
          waypoints: [
            {
              lat: 2,
              lon: 2,
              alt: 1,
              datetime: new Date().toISOString(),
              index: 0,
              speedKts: 13,
            },
            {
              lat: 1,
              lon: 1,
              alt: 1,
              datetime: new Date().toISOString(),
              index: 1,
              speedKts: 13,
            },
            {
              lat: 1,
              lon: 0,
              alt: 1,
              datetime: new Date().toISOString(),
              index: 2,
              speedKts: 13,
            },
          ],
        },
      ],
    },
  },
};

interface UserStoreState {
  input: UserInputFormData | undefined;
  aoi: AOIType | undefined;
}

const store = createStore(
  { name: 'user-state' },
  withProps<UserStoreState>({
    input: undefined,
    aoi: undefined,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  input$ = store.pipe(select((state) => state.input));
  aoi$ = store.pipe(select((state) => state.aoi));

  constructor() {
    store.update((state) => ({
      ...state,
      input: BASIC_FORM_DATA,
      aoi: BASIC_FORM_DATA.scenario.scenarioInput.aoi,
    }));
  }

  get getAOI() {
    return store.value.aoi;
  }

  updateInput(input: UserInputFormData) {
    store.update((state) => ({
      ...state,
      input: input,
      aoi: input.scenario.scenarioInput.aoi,
    }));
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
              scenario: {
                ...state.input?.scenario,
                scenarioInput: {
                  ...state.input?.scenario?.scenarioInput,
                  aoi: newAoi,
                },
              },
            }
          : undefined,
      }));
    }
  }

  updateWaypoint(platformIndex: number, waypointInfo: Waypoint[]) {
    if (platformIndex !== undefined && waypointInfo !== undefined) {
      const inputValue = store.value.input;

      const platforms = inputValue?.scenario.scenarioInput.platforms;
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
                  scenario: {
                    ...state.input.scenario,
                    scenarioInput: {
                      ...state.input.scenario.scenarioInput,
                      platforms: platforms,
                    },
                  },
                },
        }));
      }
    }
  }
}
