import { FeatureLike } from 'ol/Feature';

export interface ContextMenuElement {
  action: () => void;
  label: string;
  disabled?: boolean;
}

export interface ContextMenuBaseProps {
  document: Document;
}

export interface ContextMenuProps extends ContextMenuBaseProps {
  elements: ContextMenuElement[];
}

export class ContextMenu {
  contextMenuElement: HTMLElement | undefined | null;
  elements: ContextMenuElement[];
  feature: FeatureLike | undefined;

  constructor(props: ContextMenuProps) {
    document.addEventListener('click', (event) => {
      this.handleDocumentClick(event);
    });

    this.elements = props.elements;
  }

  createContextMenu(doc: Document, clientX: number, clientY: number) {
    this.removeContextMenu();
    this.contextMenuElement = doc.createElement('div');
    this.contextMenuElement.classList.add('dropdown');
    this.contextMenuElement.style.position = 'fixed';
    this.contextMenuElement.style.left = `${clientX}px`;
    this.contextMenuElement.style.top = `${clientY}px`;
    this.contextMenuElement.style.zIndex = '3000';
    doc.body.appendChild(this.contextMenuElement);
    this.showContextMenu();
  }

  createContextMenuForFeature(
    doc: Document,
    clientX: number,
    clientY: number,
    feature: FeatureLike,
  ) {
    this.feature = feature;
    this.createContextMenu(doc, clientX, clientY);
  }

  handleDocumentClick(event: MouseEvent) {
    if (
      this.contextMenuElement &&
      !this.contextMenuElement.contains(event.target as Node)
    ) {
      this.removeContextMenu();
    }
  }

  removeContextMenu() {
    if (this.contextMenuElement && this.contextMenuElement.parentNode) {
      this.contextMenuElement.parentNode.removeChild(this.contextMenuElement);
      this.contextMenuElement = null;
    }
  }

  showContextMenu() {
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');

    this.elements.forEach((element) =>
      menu.appendChild(this.createContextMenuElement(element)),
    );
    this.contextMenuElement!.appendChild(menu);
  }

  createContextMenuElement(
    contextMenuElement: ContextMenuElement,
  ): HTMLElement {
    const element = document.createElement('button');
    element.classList.add('context-menu');
    element.textContent = contextMenuElement.label;
    element.disabled = contextMenuElement.disabled ?? false;
    element.style.display = 'block';
    element.style.width = '100%';
    element.style.textAlign = 'left';
    element.style.cursor = 'pointer';

    if (contextMenuElement.disabled) {
      element.title = `\'${contextMenuElement.label}\' is currently disabled`;
      element.style.cursor = 'default';
    }

    element.setAttribute('role', 'menuitem');

    element.addEventListener('click', () => {
      this.removeContextMenu();
      contextMenuElement.action();
    });
    return element;
  }
}
