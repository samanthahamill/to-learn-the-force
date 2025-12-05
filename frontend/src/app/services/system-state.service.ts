import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';

interface SystemStateStore {
  maxDate: Date;
}

const store = createStore(
  { name: 'system-state' },
  withProps<SystemStateStore>({
    maxDate: new Date(),
  }),
);

@Injectable({
  providedIn: 'root',
})
export class SystemStateService {
  maxDate$ = store.pipe(select((state) => state.maxDate));

  constructor() {}

  get maxDate() {
    return store.value.maxDate;
  }
}
