import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';
import * as Styled from 'ol/style';
import {
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from 'ol/control.js';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { UserStateService } from '../../../services/user-state.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AOIType } from '../../../shared/types';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import { Circle } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { point, circle } from '@turf/turf';
<<<<<<< HEAD
import { createStringYX } from '../../../shared/utils';
=======
>>>>>>> a88f983806ddf8210550edf946cfcb5bcdaa926b

const projection = 'EPSG:4326';

@UntilDestroy()
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit {
  map: Map | undefined;
  olMapView: View;
  aoiValue: AOIType | undefined;
  vectorSource: VectorSource | undefined;
  vectorLayer: VectorLayer | undefined;

  private geoJson: GeoJSON = new GeoJSON();

  private aoiLayer: VectorLayer<any>;
  private drawingSource = new VectorSource();
  private drawingLayer!: VectorLayer<VectorSource>;
  private selectionBar!: Bar;

  private userStateService = inject(UserStateService);
  // private drawCircleAoiControl: DrawCircleAoiControl;

  @Output() currentAOI = new EventEmitter<AOIType>();

  constructor() {
    this.drawingLayer = new VectorLayer({
      source: this.drawingSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(250, 0, 234, 0.1' }),
        stroke: new Styled.Stroke({ color: 'rgb(255, 0, 235' }),
      }),
    });

    this.aoiLayer = new VectorLayer({ source: new VectorSource() });

    this.olMapView = new View({
      projection: projection,
      center: [0, 0],
      zoom: 5,
      minZoom: 1,
      maxZoom: 18,
    });

    this.userStateService.aoi$.pipe(untilDestroyed(this)).subscribe((aoi) => {
      if (aoi != this.aoiValue && this.aoiLayer) {
        this.aoiValue = aoi;
        this.renderAOI();
      }
    });

    // this.drawCircleAoiControl = new DrawCircleAoiControl({
    //   onDrawEnd: (evt: any) => this.onDrawAoiComplete(evt),
    // });
  }

  ngOnInit() {
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });

    const tile = new TileLayer({
      source: new OSM(),
    });
    tile.on('prerender', (evt) => {
      // return
      if (evt.context) {
        const context = evt.context as CanvasRenderingContext2D;
        context.filter = 'grayscale(80%) invert(100%) ';
        context.globalCompositeOperation = 'source-over';
      }
    });

    this.map = new Map({
      target: 'mapContainer',
      controls: defaultControls().extend([
        new ScaleLine({ units: 'nautical' }),
        new MousePosition({
          coordinateFormat: createStringYX(4),
          projection: projection,
          className: 'custom-mouse-position',
          target: 'mousePositionDisplay',
        }),
      ]),
      layers: [this.drawingLayer, this.aoiLayer, this.vectorLayer, tile],
      view: this.olMapView,
    });

    this.initButtonBar();
  }

  updateMapCenter() {
    if (this.map && this.aoiValue) {
      this.map
        .getView()
        .setCenter(fromLonLat([this.aoiValue.lon, this.aoiValue.lat]));
    }
  }

  renderAOI() {
    if (this.aoiValue) {
      const aoiSource = this.aoiLayer.getSource();
      if (aoiSource) {
        aoiSource.clear(true);
        const pt = point(
          [this.aoiValue.lon, this.aoiValue.lat],
          {},
          { id: 'aoi' },
        );

        const aoi = circle(pt, this.aoiValue.radius, {
          steps: 180,
          units: 'kilometers',
        });
        aoiSource.addFeature(this.geoJson.readFeature(aoi));
        // this.fixExtent = aoiSource.getExtent();
      }
    }
  }

  drawNewAOI() {
    const customAOI = new Draw({
      source: this.vectorSource,
      type: 'Circle',
    });

    this.map!.addInteraction(customAOI);

    customAOI.on('drawend', (event: DrawEvent) => {
      const geometry = event.feature.getGeometry() as Circle;
      const center = toLonLat(geometry.getCenter());
      const radius = geometry.getRadius() * 0.7;
      this.currentAOI.emit({
        lat: center[1],
        lon: center[0],
        alt: 0.0,
        radius: radius / 1852,
      });
      requestAnimationFrame(() => {
        this.map!.removeInteraction(customAOI);
      });
    });
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');

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
    // btnBar.addControl(
    //   new DrawAoiControl({
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
    this.map?.addControl(btnBar);
  }
}
