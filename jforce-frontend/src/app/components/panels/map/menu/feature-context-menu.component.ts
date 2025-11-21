import { ContextMenu, ContextMenuBaseProps } from './context-menu.component';

export type FeatureContextMenuProps = {
  deleteWaypoint: () => void;
} & ContextMenuBaseProps;

export class FeatureContextMenu extends ContextMenu {
  constructor(props: FeatureContextMenuProps) {
    super({
      ...props,
      elements: [
        {
          label: 'Delete Waypoint',
          action: () => {
            props.deleteWaypoint();
          },
        },
      ],
    });
  }
}
