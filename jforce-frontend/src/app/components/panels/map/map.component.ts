import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Coordinate, format } from 'ol/coordinate';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';
import {
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from 'ol/control.js';
import * as Styled from 'ol/style';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';

const projection = 'EPSG:4326';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit {
  map: Map | undefined;

  olMapView: View;
  private drawingSource = new VectorSource();
  private drawingLayer!: VectorLayer<VectorSource>;
  private selectionBar!: Bar;

  constructor() {
    this.drawingLayer = new VectorLayer({
      source: this.drawingSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(250, 0, 234, 0.1' }),
        stroke: new Styled.Stroke({ color: 'rgb(255, 0, 235' }),
      }),
    });

    this.olMapView = new View({
      projection: projection,
      center: [0, 0],
      zoom: 5,
      minZoom: 1,
      maxZoom: 18,
    });
  }

  ngOnInit() {
    this.map = new Map({
      target: 'mapContainer',
      controls: defaultControls().extend([
        new ScaleLine({ units: 'nautical' }),
        new MousePosition({
          coordinateFormat: this.createStringYX(4),
          projection: projection,
          className: 'custom-mouse-position',
          target: 'mousePositionDisplay',
        }),
      ]),
      layers: [
        this.drawingLayer,
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: this.olMapView,
    });

    this.initButtonBar();
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('top');

    this.selectionBar = new Bar({
      className: 'ol-feature-select-bar',
      autoDeactivate: true,
    });

    // btnBar.addControl(
    //   new ZoomToAoiControl({
    //     source: this.aoiLayer.getSource() ?? undefined,
    //   }),
    // );
    // btnBar.addControl(
    //   new ZoomToFeatureControl({
    //     source: this.trackHeadOnlyLayer.getSource() ?? undefined,
    //   }),
    // );

    const featureToggleSelection = new Toggle({
      className: 'ol-selection-bar-toggle',
      html: `<i class="fa-solid fa-object-group"></i>`,
      title: 'Report Selection Filter',
      bar: this.selectionBar,
    });
    btnBar.addControl(featureToggleSelection);

    // TODO add back in
    // this.map?.addControl(btnBar);
  }

  createStringYX(fractionDigits: number) {
    return (
      /**
       * @param {Coordinate} coordinate Coordinate.
       * @return {string} String YX.
       */
      function (coordinate: Coordinate | undefined) {
        return format(coordinate!, '{x}, {y}', fractionDigits);
      }
    );
  }
}
