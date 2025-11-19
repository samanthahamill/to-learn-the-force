import { Map, Overlay } from 'ol';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import { transform } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { MultiPoint } from 'ol/geom';
import { Snap } from 'ol/interaction';
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

export type DrawWaypointsType = {
  onDrawEnd: () => void;
  onDrawNewWaypoint: (evt: any) => void;
};
export type DrawWaypointsOptions = Options & DrawWaypointsType;

export class DrawWaypointsControl extends Toggle {
  private drawInteraction: Draw;
  private overlayLayer: VectorLayer;
  private drawEnd: () => void | undefined;
  private onDrawNewWaypoint: (event: Coordinate[]) => void | undefined;
  lengthOverlay: Overlay | undefined;
  lengthElement: HTMLElement | undefined;
  centerPoint: Array<number> | undefined;
  radiusInMeters: number = 0.0;
  map: Map | null = null;
  radiusInNmi: number = 0.0;
  snap: Snap;
  private tip: string = 'Click to Add New Waypoint';

  drawing: boolean = false;
  private source: VectorSource;

  constructor(options: DrawWaypointsOptions) {
    super(options);

    this.drawEnd = options.onDrawEnd;
    this.onDrawNewWaypoint = options.onDrawNewWaypoint;

    this.source = new VectorSource();
    this.overlayLayer = new VectorLayer({
      source: this.source,
    });

    this.drawInteraction = new Draw({
      source: this.overlayLayer.getSource() ?? undefined,
      type: 'MultiPoint',
      style: () => this.styleFunction(this.tip),
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
          new Decimal(coordinate[1]).toDecimalPlaces(2).toNumber(),
          new Decimal(coordinate[0]).toDecimalPlaces(2).toNumber(),
        ] as Coordinate;
      });

      this.onDrawNewWaypoint(points);
    });

    options.onToggle = (val: boolean) => this.handleToggle(val);
  }

  handleToggle(activate: boolean): void {
    this.source.clear();

    if (activate) {
      const map = this.getMap();
      if (map) {
        if (this.drawInteraction) {
          this.tip = 'Click to Add New Waypoint';
          map.addInteraction(this.drawInteraction);
          map.addLayer(this.overlayLayer);
        }
      }
    } else {
      const map = this.getMap();
      if (map) {
        if (this.drawInteraction) {
          map.removeInteraction(this.drawInteraction);
          this.getMap()?.removeLayer(this.overlayLayer);
          this.drawEnd();
        }
      }
    }
  }

  private styleFunction(tip?: string) {
    const styles = [];

    if (tip) {
      tipStyle.getText()?.setText(tip);
      styles.push(tipStyle);
    }

    return styles;
  }

  override setMap(map: Map) {
    super.setMap(map);
    this.map = map;
  }

  deactivate() {
    if (this.drawInteraction) {
      this.getMap()?.removeInteraction(this.drawInteraction);
      this.getMap()?.removeLayer(this.overlayLayer);
      this.drawEnd();
    }
  }

  onDestroy(): void {
    if (this.drawInteraction) {
      this.getMap()?.removeInteraction(this.drawInteraction);
    }
    this.getMap()?.removeLayer(this.overlayLayer);
    this.overlayLayer.dispose();
  }
}
