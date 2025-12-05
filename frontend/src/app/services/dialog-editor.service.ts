import { inject, Injectable, input } from '@angular/core';
import { createStore, withProps, select } from '@ngneat/elf';
import { Platform, FormPlatform } from '../shared/types';
import { UserStateService } from './user-state.service';
import {
  createFormDateString,
  createISODateFromFormString,
} from '../shared/utils';
import {
  formPlatformToPlatform,
  formWaypointToWaypoint,
  platformToFormPlatform,
  waypointToFormWaypoint,
} from '../shared/create';

export interface PlatformEditorInformation {
  platform: FormPlatform;
  platformIndex: number;
}

interface DialogEditorState {
  platformInformation: PlatformEditorInformation | undefined;
  metadataPing: number;
}

const store = createStore(
  { name: 'dialog-editor-state' },
  withProps<DialogEditorState>({
    platformInformation: undefined,
    metadataPing: 0,
  }),
);

@Injectable({
  providedIn: 'root',
})
export class DialogEditorService {
  platformInformation$ = store.pipe(
    select((state) => state.platformInformation),
  );
  scenarioInfo$ = store.pipe(select((state) => state.platformInformation));
  metadataPing$ = store.pipe(select((state) => state.metadataPing));
  userStateService = inject(UserStateService);

  showMetadataDialog() {
    store.update((state) => ({
      ...state,
      metadataPing: state.metadataPing + 1,
    }));
  }

  updatePlatformAndOpenDialog(platformIndex: number) {
    const info = {
      platform: this.userStateService.getPlatform(platformIndex),
      platformIndex: platformIndex,
    };

    if (info !== undefined && info.platform !== undefined) {
      store.update((state) => ({
        ...state,
        platformInformation: {
          platform: platformToFormPlatform(info.platform!),
          platformIndex: info.platformIndex,
        },
      }));
    }
  }

  saveUpdatedInformation() {
    const platformInfo = store.value.platformInformation;

    if (platformInfo !== undefined) {
      this.userStateService.updatePlatform(
        platformInfo.platformIndex,
        formPlatformToPlatform(platformInfo.platform),
      );
    }
  }
}
