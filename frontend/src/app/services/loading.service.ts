import { Injectable } from '@angular/core';
import { createStore, select, withProps } from '@ngneat/elf';

interface LoadingState {
  showLoadingMessage: string | undefined;
}

const store = createStore(
  { name: 'loading-state' },
  withProps<LoadingState>({
    showLoadingMessage: undefined,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  constructor() {}
  showLoadingMessage$ = store.pipe(select((state) => state.showLoadingMessage));

  initiateLoadingScreen(loadingMessage: string) {
    this.changeLoadingState(loadingMessage);
  }

  closeLoadingScrean() {
    this.changeLoadingState(undefined);
  }

  changeLoadingState(loadingMessage: string | undefined) {
    store.update((state) => ({
      ...state,
      showLoadingMessage: loadingMessage,
    }));
  }
}
