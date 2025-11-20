import { inject, Injectable, input } from '@angular/core';
import { createStore, withProps, select } from '@ngneat/elf';
import { Waypoint, Platform } from '../shared/types';
import { UserStateService } from './user-state.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { untilDestroyed } from '@ngneat/until-destroy';
import { createFormDateString } from '../shared/create';
import { meta } from '@turf/turf';

export interface PlatformEditorInformation {
  platform: Platform;
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
