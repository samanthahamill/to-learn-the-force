import { inject, Injectable } from '@angular/core';
import { Platform, Waypoint } from '../shared/types';
import { createStore, select, withProps } from '@ngneat/elf';
import { UserStateService } from './user-state.service';

export interface PlatformEditorInformation {
  platform: Platform;
  platformIndex: number;
}

interface PlatformState {
  platformInformation: PlatformEditorInformation | undefined;
}

const store = createStore(
  { name: 'platform-state' },
  withProps<PlatformState>({
    platformInformation: undefined,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class PlatformEditorService {
  platformInformation$ = store.pipe(
    select((state) => state.platformInformation),
  );

  userStateService = inject(UserStateService);

  constructor() {}

  updatePlatformAndOpenDialog(platform: Platform, platformIndex: number) {
    const info = {
      platform: platform,
      platformIndex: platformIndex,
    };
    store.update((state) => ({
      ...state,
      platformInformation: info,
    }));
  }

  saveUpdatedInformation() {
    const platformInfo = store.value.platformInformation;

    if (platformInfo !== undefined) {
      this.userStateService.updatePlatform(
        platformInfo.platformIndex,
        platformInfo.platform,
      );
    }
  }
}
