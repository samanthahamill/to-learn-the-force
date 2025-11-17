import Toggle, { Options } from 'ol-ext/control/Toggle';
import { Draw } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import { getDistance } from 'ol/sphere';
import { convertLength } from '@turf/turf';
import { FeatureLike } from 'ol/Feature';

const style = new Style({
  fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
  stroke: new Stroke({
    color: 'rgb(255, 255, 255)',
    lineDash: [10, 10],
    width: 2,
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Lato',
    fill: new Fill({ color: 'rgb(255, 255, 255)' }),
    backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.3)' }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
});

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

export type MeasurementToolOptions = Options & {
  onToggle: (val: boolean) => void;
};

export class MeasurementToolControl extends Toggle {
  private overlayLayer: VectorLayer;
  private drawInteraction: Draw;
  private source: VectorSource;
  private tip: string = 'Click to Start Measuring';

  constructor(options: MeasurementToolOptions) {
    options.onToggle = (val: boolean) => this.handleToggle(val);
    super(options);

    this.source = new VectorSource();
    this.overlayLayer = new VectorLayer({
      source: this.source,
      style: (feature) => this.styleFunction(feature),
    });

    this.drawInteraction = new Draw({
      type: 'LineString',
      minPoints: 2,
      maxPoints: 2,
      source: this.source,
      style: (feature) => this.styleFunction(feature, this.tip),
    });

    this.tip = 'Click to Start Measuring';
  }

  private handleToggle(value: boolean) {
    this.source.clear();
    if (value) {
      const map = this.getMap();
      if (map) {
        if (this.drawInteraction) {
          this.tip = 'Click to Start Measuring';
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
        }
      }
    }
  }

  private formatLength(line: LineString) {
    const first = line.getFirstCoordinate();
    const last = line.getLastCoordinate();
    const length = getDistance(first, last);
    const nmi = convertLength(length, 'meters', 'nauticalmiles');
    return `${nmi.toFixed(1)} nmi`;
  }

  private styleFunction(feature: FeatureLike, tip?: string) {
    const styles = [style];
    const geometry: LineString | undefined =
      feature.getGeometry() as LineString;
    const point = new Point(geometry.getLastCoordinate());

    const label = this.formatLength(geometry);
    if (label) {
      labelStyle.setGeometry(point);
      labelStyle.getText()?.setText(label);
      styles.push(labelStyle);
    }

    if (tip) {
      tipStyle.getText()?.setText(tip);
      styles.push(tipStyle);
    }

    return styles;
  }
}
