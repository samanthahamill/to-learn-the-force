import { Map, Overlay } from 'ol';
import { Control } from 'ol/control';
import { Options } from 'ol/control/Control';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import { transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { MultiPoint } from 'ol/geom';
import { convertLength } from '@turf/helpers';
import { ChangeAOIRequest } from '../../../../services/user-state.service';
import { Snap } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import { Decimal } from 'decimal.js';

const PROJECTION_TYPE = 'EPSG:4326';

export type DrawWaypointsType = { onDrawEnd: (evt: any) => void };
export type DrawWaypointsOptions = Options & DrawWaypointsType;

export class DrawWaypointsControl extends Control {
  private drawInteraction: Draw;
  private overlayLayer: VectorLayer;
  private drawEnd: (event: Coordinate[]) => void | undefined;
  lengthOverlay: Overlay | undefined;
  lengthElement: HTMLElement | undefined;
  centerPoint: Array<number> | undefined;
  radiusInMeters: number = 0.0;
  map: Map | null = null;
  radiusInNmi: number = 0.0;
  snap: Snap;

  drawing: boolean = false;

  constructor(options: DrawWaypointsOptions) {
    const button = document.createElement('button');
    button.title = 'Add Waypoints';
    button.innerHTML = "<i class='fa fa-dot-circle'></i>"; // change me
    const element = document.createElement('div');
    element.className = 'ol-waypoints ol-unselectable ol-control';
    element.appendChild(button);

    super({ element: element, target: options.target });

    this.drawEnd = options.onDrawEnd;
    this.overlayLayer = new VectorLayer({ source: new VectorSource() });

    this.drawInteraction = new Draw({
      source: this.overlayLayer.getSource() ?? undefined,
      type: 'MultiPoint',
    });
    this.snap = new Snap({
      source: this.overlayLayer.getSource() ?? undefined,
    });

    this.drawInteraction.on('drawend', (event: DrawEvent) => {
      const geometry = event.feature.getGeometry() as MultiPoint;
      const viewProjection = this.map!.getView().getProjection();
      const points = geometry.getCoordinates().map((coord) => {
        const coordinate = transform(coord, viewProjection, PROJECTION_TYPE);
        return [
          new Decimal(coordinate[0]).toDecimalPlaces(2).toNumber(),
          new Decimal(coordinate[1]).toDecimalPlaces(2).toNumber(),
        ] as Coordinate;
      });

      this.drawEnd(points);
    });

    button.addEventListener('click', () => {
      if (this.drawing) {
        this.map!.removeInteraction(this.drawInteraction);
        this.drawing = false;
      } else {
        this.activate();
      }
    });
  }

  activate(): void {
    if (this.getMap()) {
      if (this.drawInteraction) {
        this.getMap()?.addInteraction(this.drawInteraction);
        this.drawing = true;
      }
    }
  }

  override setMap(map: Map | null) {
    super.setMap(map);
    this.map = map;
  }
}
