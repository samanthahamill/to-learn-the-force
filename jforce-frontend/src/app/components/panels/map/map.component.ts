import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';
import * as Styled from 'ol/style';
import { Stroke, Circle as CircleStyle } from 'ol/style';
import {
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from 'ol/control.js';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import {
  ChangeAOIRequest,
  UserStateService,
} from '../../../services/user-state.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AOIType, Platform, Waypoint } from '../../../shared/types';
import { fromLonLat, getUserProjection, Projection, toLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import ContextMenu, { CallbackObject } from 'ol-contextmenu';
import { Circle, Point } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import {
  createStringYX,
  MAP_FACTOR,
  NMI_TO_M,
  PLATFORM_TRACK_COLORS,
  toRadians,
} from '../../../shared/utils';
import Feature from 'ol/Feature';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TerraDraw, TerraDrawPointMode } from 'terra-draw';
import { TerraDrawOpenLayersAdapter } from 'terra-draw-openlayers-adapter';
import {
  polygonToLine,
  greatCircle,
  point,
  bearing,
  destination,
  Units,
  convertLength,
  circle,
  polygon,
} from '@turf/turf';
import { Extent } from 'ol/extent';
import { DrawCircleAoiControl } from './control/draw-circle-aoi-control.component';

// import { FeatureId } from 'terra-draw/dist/store/store';
export type FeatureId = string | number;

const projection = 'EPSG:4326';
const aoiStyle = new Style({
  stroke: new Styled.Stroke({ color: 'yellow', width: 2 }),
});

@UntilDestroy()
@Component({
  selector: 'app-map',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy {
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
  private drawCircleAoiControl: DrawCircleAoiControl;

  platformWaypointSource: VectorSource = new VectorSource();
  platformWaypointLayer: VectorLayer;
  terraDraw: TerraDraw | undefined;
  terraDrawOpenLayerAdapter: TerraDrawOpenLayersAdapter | undefined;
  fitExtent: Extent | undefined;
  contextMenuElement: HTMLElement | null = null;

  constructor() {
    this.drawingLayer = new VectorLayer({
      source: this.drawingSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(250, 0, 234, 0.1' }),
        stroke: new Styled.Stroke({ color: 'rgb(255, 0, 235' }),
      }),
    });

    this.aoiLayer = new VectorLayer({
      source: new VectorSource(),
      style: aoiStyle,
    });

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

    this.drawCircleAoiControl = new DrawCircleAoiControl({
      onDrawEnd: (evt: any) => this.onDrawCircleAoiComplete(evt),
    });

    this.userStateService.aoi$.pipe(untilDestroyed(this)).subscribe((aoi) => {
      console.log('here');
      if (aoi !== undefined && aoi != this.aoiValue && this.aoiLayer) {
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

    // const tile = new TileLayer({
    //   source: new OSM(),
    // });
    // tile.on('prerender', (evt) => {
    //   // return
    //   if (evt.context) {
    //     const context = evt.context as CanvasRenderingContext2D;
    //     context.filter = 'grayscale(80%) invert(100%)';
    //     context.globalCompositeOperation = 'darken';
    //   }
    // });

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
        new TileLayer({
          source: new OSM(),
        }),
        this.drawingLayer,
        this.aoiLayer,
        this.vectorLayer,
        this.platformWaypointLayer,
      ],
      view: this.olMapView,
    });

    this.initButtonBar();
    this.initTerraDraw();
  }

  initTerraDraw() {
    this.map?.once('rendercomplete', () => {
      this.terraDrawOpenLayerAdapter = new TerraDrawOpenLayersAdapter({
        lib: {
          Feature,
          GeoJSON,
          Style,
          VectorLayer,
          VectorSource,
          Stroke,
          getUserProjection,
          fromLonLat,
          Projection,
          Circle: CircleStyle,
          Fill,
          Icon: Styled.Icon,
          toLonLat,
        },
        map: this.map!,
        coordinatePrecision: 9,
      });
      this.terraDraw = new TerraDraw({
        adapter: this.terraDrawOpenLayerAdapter,
        modes: [new TerraDrawPointMode({ styles: { pointOutlineWidth: 2 } })],
      });
    });

    this.terraDraw?.on('finish', (id, context) => {
      if (context.action == 'draw') {
        const selection = this.terraDraw?.getSnapshotFeature(id);
        if (selection) {
          this.handleSelectionComplete(id);
        }
      }

      this.terraDraw?.clear();
      this.terraDraw?.stop();
      this.resetMapCursor();
    });
  }

  // @HostListener('window:keydown', [`$event`])
  // handleKeydown(event: KeyboardEvent) {
  //   if (event.key === 'Excape') {
  //     if (
  //       this.terraDraw?.getModeState() === 'started' ||
  //       this.terraDraw?.getModeState() === 'drawing'
  //     ) {
  //       event.preventDefault();
  //       event.stopPropagation();
  //       this.terraDraw.clear();
  //       this.terraDraw.stop();
  //       this.resetMapCursor();
  //     }
  //   }
  // }

  activateTerraDraw() {
    this.terraDraw?.start();
    this.terraDraw?.clear();
    this.terraDraw?.setMode('point');
  }

  private handleSelectionComplete(selectionId: FeatureId) {
    const selectionFeature = this.terraDraw
      ?.getSnapshot()
      .find((f) => f.id === selectionId);

    if (!selectionFeature || selectionFeature.geometry.type !== 'Polygon')
      return;

    const selectionPolygon = polygon(selectionFeature?.geometry.coordinates);

    const intersectionIds: Waypoint[] = [];
  }

  private resetMapCursor() {
    this.terraDrawOpenLayerAdapter?.setCursor('unset');
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
      const source = this.aoiLayer.getSource();
      if (source) {
        source.clear(true);

        const pt = point(
          [this.aoiValue.lat, this.aoiValue.lon],
          {},
          { id: 'aoi' },
        );
        const aoi = circle(pt, this.aoiValue.radius, {
          steps: 180,
          units: 'nauticalmiles',
        });
        source.addFeature(this.geoJson.readFeature(aoi));
        this.fitExtent = source.getExtent();
      }
    }
  }

  private onDrawCircleAoiComplete(evt: ChangeAOIRequest) {
    this.userStateService.updateAOIRequest(evt);
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');
    btnBar.addControl(this.drawCircleAoiControl);
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

  private destroyMap() {
    if (this.map) {
      this.aoiLayer.dispose();
      this.drawingLayer.dispose();
      this.vectorLayer?.dispose();
      this.map.dispose();
      this.map = undefined;
      this.vectorSource = undefined;
      this.vectorLayer = undefined;
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }
}
