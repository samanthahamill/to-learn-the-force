import { ContextMenu, ContextMenuBaseProps } from './context-menu.component';

export class FeatureContextMenu extends ContextMenu {
  constructor(props: ContextMenuBaseProps) {
    super({
      ...props,
      elements: [
        {
          label: 'Delete Platform',
          action: () => {
            // props.deletePlatform(); TODO implement
          },
        },
      ],
    });
  }
}
