import { Map, Overlay } from 'ol';
import { Control } from 'ol/control';
import { Options } from 'ol/control/Control';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import { fromUserCoordinate, transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle, GeometryCollection, Point, Polygon } from 'ol/geom';
import { convertLength } from '@turf/helpers';
import { ChangeAOIRequest } from '../../../../services/user-state.service';
import { Snap } from 'ol/interaction';
import { MAP_PROJECTION } from '../../../../shared/utils';
import { circular } from 'ol/geom/Polygon';
import { getDistance } from 'ol/sphere';
import { squaredDistance } from 'ol/coordinate';
import { COMPASS_DRAFTING_ICON } from '../../../../shared/icons';

export interface DrawAoiCallbacks {
  onDrawEnd: (evt: any) => void;
}
export type DrawAoiOptions = Options & DrawAoiCallbacks;

export class DrawCircleAoiControl extends Control {
  private drawInteraction: Draw;
  private overlayLayer: VectorLayer;
  private drawEnd: (event: ChangeAOIRequest) => void | undefined;
  lengthOverlay: Overlay | undefined;
  lengthElement: HTMLElement | undefined;
  centerPoint: Array<number> | undefined;
  radiusInMeters: number = 0.0;
  map: Map | null = null;
  radiusInNmi: number = 0.0;
  snap: Snap;
  _circle: Circle | undefined;

  constructor(options: DrawAoiOptions) {
    const button = document.createElement('button');
    button.title = 'Draw New AOI';
    // Dot to circle icon
    button.innerHTML = COMPASS_DRAFTING_ICON;
    const element = document.createElement('div');
    element.className = 'ol-zoom-aoi ol-unselectable ol-control';
    element.appendChild(button);

    super({ element: element, target: options.target });

    this.drawEnd = options.onDrawEnd;
    this.overlayLayer = new VectorLayer({ source: new VectorSource() });

    this.drawInteraction = new Draw({
      source: this.overlayLayer.getSource() ?? undefined,
      type: 'Circle',
      geometryFunction: this.geometryFunction,
    });
    this.snap = new Snap({
      source: this.overlayLayer.getSource() ?? undefined,
    });

    this.drawInteraction.on('drawend', (event: DrawEvent) => {
      const geometry = event.feature.getGeometry() as GeometryCollection;

      const center = (
        geometry.getGeometries()[1] as Point
      ).getFirstCoordinate();
      const last = (geometry.getGeometries()[0] as Polygon).getLastCoordinate();

      const viewProjection = this.map!.getView().getProjection();
      const centerProjected = transform(center, viewProjection, MAP_PROJECTION);

      const radius = getDistance(center, last);

      this.drawEnd({
        centerLat: centerProjected[1],
        centerLon: centerProjected[0],
        radius: convertLength(radius, 'meters', 'nauticalmiles'),
      });
      requestAnimationFrame(() => {
        this.map!.removeInteraction(this.drawInteraction);
        this.map!.removeInteraction(this.snap);
      });
    });

    button.addEventListener('click', () => this.activate());
  }

  geometryFunction(coordinates: any, geometry: any, projection: any) {
    if (!geometry) {
      geometry = new GeometryCollection([
        new Polygon([]),
        new Point(coordinates[0]),
      ]);
    }
    const geometries = geometry.getGeometries();
    const center = transform(coordinates[0], projection, MAP_PROJECTION);
    const last = transform(coordinates[1], projection, MAP_PROJECTION);
    const radius = getDistance(center, last);
    const circle = circular(center, radius, 128);
    circle.transform(MAP_PROJECTION, projection);
    geometries[0].setCoordinates(circle.getCoordinates());
    geometry.setGeometries(geometries, geometry);
    return geometry;
  }

  activate(): void {
    if (this.getMap()) {
      if (this.drawInteraction) {
        this.getMap()?.addInteraction(this.drawInteraction);
        this.getMap()?.addInteraction(this.snap);
      }
    }
  }

  override setMap(map: Map | null) {
    super.setMap(map);
    this.map = map;
  }
}
