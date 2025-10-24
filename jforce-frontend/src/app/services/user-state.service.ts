import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';
import { AOIType, UserInputFormData } from '../shared/types';

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

  constructor() {}

  get getAOI() {
    return store.value.aoi;
  }

  updateInput(input: UserInputFormData) {
    store.update((state) => ({ ...state, input: input }));
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
      }));
    }
  }
}
