import { ContextMenu, ContextMenuBaseProps } from './context-menu.component';
import { FormBuilder } from '@angular/forms';
import { getNewPlatformFormGroup } from '../../../../shared/create';
import { inject } from '@angular/core';
import { UserStateService } from '../../../../services/user-state.service';

export type MapContextMenuProps = {
  toggleTrackLabels: () => void;
} & ContextMenuBaseProps;

export class MapContextMenu extends ContextMenu {
  private userStateService = inject(UserStateService);
  private fb = inject(FormBuilder);

  constructor(props: MapContextMenuProps) {
    super({
      ...props,
      elements: [
        {
          label: 'Toggle Platform Labels',
          action: () => {
            props.toggleTrackLabels();
          },
        },
        {
          label: 'Add New Platform',
          action: () => {
            this.userStateService.addPlatform(
              getNewPlatformFormGroup(
                this.fb,
                `Platform ${this.userStateService.platformLength + 1}`,
              ),
            );
          },
        },
      ],
    });
  }
}
