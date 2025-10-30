import { Map, Overlay } from 'ol';
import { Control } from 'ol/control';
import { Options } from 'ol/control/Control';
import Draw, {
  DrawEvent,
  GeometryFunction,
  LineCoordType,
  SketchCoordType,
} from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import {
  fromLonLat,
  getPointResolution,
  Projection,
  toLonLat,
  transform,
} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import Decimal from 'decimal.js';
import {
  Circle,
  Geometry,
  GeometryCollection,
  LineString,
  Point,
  Polygon,
  SimpleGeometry,
} from 'ol/geom';
import { circular } from 'ol/geom/Polygon';
import { convertLength } from '@turf/helpers';
import { getDistance, getLength, offset } from 'ol/sphere';
import { ChangeAOIRequest } from '../../../../services/user-state.service';
import { Snap } from 'ol/interaction';
import { MAP_FACTOR, NMI_TO_M } from '../../../../shared/utils';

const PROJECTION_TYPE = 'EPSG:4326';

export type DrawAoiCallbacks = { onDrawEnd: (evt: any) => void };
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

  constructor(options: DrawAoiOptions) {
    const ctrlOptions: Options = <Options>(<unknown>options);
    const button = document.createElement('button');
    button.title = 'Draw New AOI';
    button.innerHTML = "<i class='fa fa-dot-circle'></i>";
    const element = document.createElement('div');
    element.className = 'ol-zoom-aoi ol-unselectable ol-control';
    element.appendChild(button);

    super({ element: element, target: options.target });

    this.drawEnd = options.onDrawEnd;
    this.overlayLayer = new VectorLayer({ source: new VectorSource() });

    this.drawInteraction = new Draw({
      source: this.overlayLayer.getSource() ?? undefined,
      type: 'Circle',
    });
    this.snap = new Snap({
      source: this.overlayLayer.getSource() ?? undefined,
    });

    this.drawInteraction.on('drawend', (event: DrawEvent) => {
      const geometry = event.feature.getGeometry() as Circle;
      const viewProjection = this.map!.getView().getProjection();
      const centerProjected = transform(
        geometry.getCenter(),
        viewProjection,
        PROJECTION_TYPE,
      );

      this.drawEnd({
        centerLat: centerProjected[0],
        centerLon: centerProjected[1],
        radius: convertLength(geometry.getRadius(), 'degrees', 'nauticalmiles'),
      });
      //   this.map?.removeOverlay(this.lengthOverlay);
      requestAnimationFrame(() => {
        this.map!.removeInteraction(this.drawInteraction);
      });
    });

    button.addEventListener('click', () => this.activate());

    // this.drawInteraction.on('drawend', (evt: DrawEvent) => this.onDrawEnd(evt));
  }

  //   onDrawEnd(evt: DrawEvent) {
  //     if (this.lengthOverlay) {
  //       this.map?.removeOverlay(this.lengthOverlay);
  //     }
  //     if (this.lengthElement?.parentNode?.removeChild(this.lengthElement)) {
  //       this.lengthElement = undefined;
  //     }

  //     if (this.centerPoint) {
  //       var lonLat = toLonLat(this.centerPoint, PROJECTION_TYPE);

  //       const newAOI: ChangeAOIRequest = {
  //         centerLat: new Decimal(lonLat[1]).toDecimalPlaces(3).toNumber(),
  //         centerLon: new Decimal(lonLat[0]).toDecimalPlaces(3).toNumber(),
  //         radius: new Decimal(this.radiusInNmi ?? 0)
  //           .toDecimalPlaces(3)
  //           .toNumber(),
  //       };

  //       this.drawEnd(newAOI);
  //     }
  //   }

  activate(): void {
    if (this.getMap()) {
      if (this.drawInteraction) {
        this.getMap()?.addInteraction(this.drawInteraction);
      }
    }
  }

  override setMap(map: Map | null) {
    super.setMap(map);
    this.map = map;
  }
}
