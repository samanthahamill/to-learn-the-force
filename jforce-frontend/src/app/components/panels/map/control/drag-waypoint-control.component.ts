import { Map, Overlay } from 'ol';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import { transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { MultiPoint } from 'ol/geom';
import { Select, Snap, Translate } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import { Decimal } from 'decimal.js';
import Toggle, { Options } from 'ol-ext/control/Toggle';
import { Style, Text, Fill } from 'ol/style';
import { OnDestroy } from '@angular/core';

const PROJECTION_TYPE = 'EPSG:4326';

const tipStyle = new Style({
  text: new Text({
    font: '12px Lato',
    fill: new Fill({ color: 'rgb(255, 255, 255)' }),
    backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.3)' }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

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

    this.updateCoordinate = (newCoords, waypointId) =>
      options.updateCoordinate(newCoords, waypointId);
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

  onDestroy(): void {
    if (this.translate) {
      this.getMap()?.removeInteraction(this.translate);
    }
    if (this.select) {
      this.getMap()?.removeInteraction(this.select);
    }
  }
}
