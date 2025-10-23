import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';
import { UserInputFormData } from '../shared/types';

interface UserStoreState {
  input: UserInputFormData | undefined;
}

const store = createStore(
  { name: 'user-state' },
  withProps<UserStoreState>({
    input: undefined,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  input$ = store.pipe(select((state) => state.input));

  constructor() {}

  updateInput(input: UserInputFormData) {
    store.update((state) => ({ ...state, input: input }));
  }
}
