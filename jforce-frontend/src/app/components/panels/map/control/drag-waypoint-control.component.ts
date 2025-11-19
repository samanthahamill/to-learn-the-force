import { Select, Translate } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import Toggle, { Options } from 'ol-ext/control/Toggle';

export type DragWaypointsType = {
  updateCoordinate: (newCoord: Coordinate, waypointId: string) => void;
  onUpdateFinished: () => void;
};
export type DragWaypointsOptions = Options & DragWaypointsType;

export class DragWaypointsControl extends Toggle {
  select: Select | undefined;
  translate: Translate | undefined;
  updateCoordinate: (newCoord: Coordinate, waypointId: string) => void;
  onUpdateFinished: () => void;

  constructor(options: DragWaypointsOptions) {
    super(options);

    this.updateCoordinate = options.updateCoordinate;
    this.onUpdateFinished = () => options.onUpdateFinished();
    options.onToggle = (activated) => this.handleToggle(activated);
  }

  handleToggle(activated: boolean) {
    if (activated) {
      this.select = new Select();
      this.translate = new Translate({
        features: this.select.getFeatures(),
      });

      this.getMap()?.addInteraction(this.translate);
      this.getMap()?.addInteraction(this.select);

      this.translate.on('translating', (evt) => {
        const id = this.select?.getFeatures().getArray()[0].getId();
        this.updateCoordinate(evt.coordinate, id ? (id as string) : 'unknown');
      });
    } else {
      this.getMap()?.removeInteraction(this.translate!);
      this.getMap()?.removeInteraction(this.select!);
      this.onUpdateFinished();
      this.select = undefined;
      this.translate = undefined;
    }
  }

  deactivate() {
    if (this.translate) {
      this.getMap()?.removeInteraction(this.translate);
    }
    if (this.select) {
      this.getMap()?.removeInteraction(this.select);
    }
  }

  onDestroy(): void {
    this.deactivate();
  }
}
