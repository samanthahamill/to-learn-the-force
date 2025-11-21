import { FeatureLike } from 'ol/Feature';

export interface ContextMenuElement {
  action: () => void;
  label: string;
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
    doc.body.appendChild(this.contextMenuElement);
    this.showContextMenu();
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
    element.style.display = 'block';
    element.style.width = '100%';
    element.style.textAlign = 'left';
    element.style.cursor = 'pointer';
    element.setAttribute('role', 'menuitem');

    element.addEventListener('click', () => {
      this.removeContextMenu();
      contextMenuElement.action();
    });
    return element;
  }
}
