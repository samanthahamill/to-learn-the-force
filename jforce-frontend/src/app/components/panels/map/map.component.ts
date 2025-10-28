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
import { AOIType, Platform, Waypoint } from '../../../shared/types';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import { Circle, Point } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { point, circle } from '@turf/turf';
import { createStringYX, PLATFORM_TRACK_COLORS } from '../../../shared/utils';
import Feature from 'ol/Feature';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

const projection = 'EPSG:4326';

@UntilDestroy()
@Component({
  selector: 'app-map',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit {
  map: Map | undefined;
  olMapView: View;
  aoiValue: AOIType | undefined;
  data: Platform[] = [];
  vectorSource: VectorSource | undefined;
  vectorLayer: VectorLayer | undefined;

  private geoJson: GeoJSON = new GeoJSON();

  private aoiLayer: VectorLayer<any>;
  private drawingSource = new VectorSource();
  private drawingLayer!: VectorLayer<VectorSource>;
  private draw: Draw | undefined = undefined;
  private isDrawing: boolean;

  private userStateService = inject(UserStateService);
  // private drawCircleAoiControl: DrawCircleAoiControl;

  platformWaypointSource: VectorSource = new VectorSource();
  platformWaypointLayer: VectorLayer;

  constructor() {
    this.drawingLayer = new VectorLayer({
      source: this.drawingSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(250, 0, 234, 0.1' }),
        stroke: new Styled.Stroke({ color: 'rgb(255, 0, 235' }),
      }),
    });

    this.aoiLayer = new VectorLayer({ source: new VectorSource() });

    this.platformWaypointSource = new VectorSource();
    this.platformWaypointLayer = new VectorLayer({
      visible: true,
      source: this.platformWaypointSource,
    });

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

    this.userStateService.input$
      .pipe(untilDestroyed(this))
      .subscribe((input) => {
        this.data = input?.scenario?.scenarioInput?.platforms ?? [];
        this.updateTracks();
      });

    this.isDrawing = false;
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
      layers: [
        tile,
        this.drawingLayer,
        this.aoiLayer,
        this.vectorLayer,
        this.platformWaypointLayer,
      ],
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

  drawNewAOI(active: boolean) {
    this.isDrawing = true;
    if (!active) {
      if (this.draw) {
        this.map!.removeInteraction(this.draw);
      }
      this.isDrawing = false;
      return;
    }

    this.draw = new Draw({
      source: this.vectorSource,
      type: 'Circle',
    });

    this.map!.addInteraction(this.draw);

    this.draw.on('drawend', (event: DrawEvent) => {
      const geometry = event.feature.getGeometry() as Circle;
      const center = toLonLat(geometry.getCenter());
      const radius = geometry.getRadius() * 0.7;

      this.userStateService.updateAOI({
        lat: center[1],
        lon: center[0],
        alt: 0.0,
        radius: radius / 1852,
      });

      this.isDrawing = false;
      requestAnimationFrame(() => {
        this.map!.removeInteraction(this.draw!);
      });
    });
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');

    const drawNewAoi = new Toggle({
      className: 'ol-draw-aoi-toggle',
      html: `<i class="fa-solid fa-object-group"></i>`,
      title: 'Draw New AOI',
      active: this.isDrawing,
      onToggle: (active) => this.drawNewAOI(active),
    });
    btnBar.addControl(drawNewAoi);

    // TODO add back in
    this.map?.addControl(btnBar);
  }

  updateTracks() {
    if (!this.platformWaypointLayer) return;

    this.platformWaypointSource.clear();

    const features = this.data.flatMap((platform) => {
      return platform.waypoints.flatMap((waypoint) => {
        return this.createWaypointFeature(waypoint, platform.name, platform.id);
      });
    });

    console.log(features);

    this.platformWaypointSource.addFeatures(features);
  }

  createWaypointFeature(
    waypoint: Waypoint,
    platformName: string,
    platformId: string,
  ) {
    const feature = new Feature(
      new Point(fromLonLat([waypoint.lon, waypoint.lat])),
    );
    const hex = '0000'.substr(String(platformId).length) + platformId;
    const color = this.getColorIndex(hex);
    const label = `Platform: ${platformName} Waypoint ${waypoint.index}\nloc: [${(waypoint.lon, waypoint.lat)}];\nalt: ${waypoint.alt}\nspeed:${waypoint.speedKts}`;
    feature.setStyle([
      new Styled.Style({
        image: new Styled.Circle({
          radius: 7,
          fill: new Styled.Fill({
            color: color,
          }),
          stroke: new Styled.Stroke({ color: 'white', width: 2 }),
        }),
      }),
      new Styled.Style({
        text: new Styled.Text({
          text: label,
          font: '10px sans-serif',
          fill: new Styled.Fill({
            color: 'black',
          }),
          stroke: new Styled.Stroke({
            color: 'white',
            width: 3,
          }),
          offsetX: 15,
          offsetY: 15,
          textAlign: 'center',
        }),
      }),
    ]);

    feature.set('label', label);
    feature.set('id', `${platformName}-${waypoint.index}`);

    return feature;
  }

  getColorIndex(uid: string): number[] {
    const hash =
      uid.charCodeAt(0) +
      uid.charCodeAt(1) * 3 +
      uid.charCodeAt(2) * 5 +
      uid.charCodeAt(3) * 7;
    return PLATFORM_TRACK_COLORS[hash % PLATFORM_TRACK_COLORS.length];
  }
}
