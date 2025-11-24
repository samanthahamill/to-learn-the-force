import { FeatureLike } from 'ol/Feature';
import { ContextMenu, ContextMenuBaseProps } from './context-menu.component';

export type FeatureContextMenuProps = {
  deleteWaypoint: (feature: FeatureLike) => void;
} & ContextMenuBaseProps;

export class FeatureContextMenu extends ContextMenu {
  constructor(props: FeatureContextMenuProps) {
    super({
      ...props,
      elements: [
        {
          label: 'Delete Waypoint',
          action: () => {
            if (this.feature) {
              props.deleteWaypoint(this.feature);
            }
          },
        },
      ],
    });
  }
}
