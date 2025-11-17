import { inject, OnDestroy, OnInit } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import Bar from 'ol-ext/control/Bar';
import * as Styled from 'ol/style';
import { Stroke, Circle as CircleStyle } from 'ol/style';
import {
  Control,
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from 'ol/control.js';
import TileLayer from 'ol/layer/Tile';
import { OSM, StadiaMaps } from 'ol/source';
import { UserStateService } from '../../../services/user-state.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AOIType, Platform, Waypoint } from '../../../shared/types';
import { fromLonLat, getUserProjection, Projection, toLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import {
  createStringYX,
  GREEN_COLORS,
  MAP_PROJECTION,
  RED_COLORS,
} from '../../../shared/utils';
import Feature from 'ol/Feature';
import { TerraDraw, TerraDrawPointMode } from 'terra-draw';
import { TerraDrawOpenLayersAdapter } from 'terra-draw-openlayers-adapter';
import { point, circle, polygon, lineString } from '@turf/turf';
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { MapContextMenu } from './menu/map-context-menu.component';
import Toggle from 'ol-ext/control/Toggle';
import { LineString } from 'ol/geom';

// import { FeatureId } from 'terra-draw/dist/store/store';
export type FeatureId = string | number;

const aoiStyle = new Style({
  stroke: new Styled.Stroke({ color: 'yellow', width: 2 }),
});

const vectorStyle = new Style({
  stroke: new Styled.Stroke({ color: 'white', width: 2 }),
});

@UntilDestroy()
export class BaseMapComponent implements OnInit, OnDestroy {
  map: Map | undefined;
  olMapView: View;
  aoiValue: AOIType | undefined;
  data: Platform[] = [];

  geoJson: GeoJSON = new GeoJSON();

  aoiLayer: VectorLayer<any>;
  drawingSource = new VectorSource();
  drawingLayer!: VectorLayer<VectorSource>;

  userStateService = inject(UserStateService);

  platformWaypointSource: VectorSource = new VectorSource();
  platformWaypointLayer: VectorLayer;
  platformVectorSource: VectorSource = new VectorSource();
  platformVectorLayer: VectorLayer;

  terraDraw: TerraDraw | undefined;
  terraDrawOpenLayerAdapter: TerraDrawOpenLayersAdapter | undefined;
  fitExtent: Extent | undefined;
  contextMenuElement: HTMLElement | null = null;

  target: string;

  showTrackLabels: boolean;
  platformVectorVisible: boolean;
  private mapContextMenu: MapContextMenu;

  constructor(target: string) {
    this.target = target;
    this.showTrackLabels = true;
    this.platformVectorVisible = true;

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
      style: vectorStyle,
    });

    this.platformVectorLayer = new VectorLayer({
      visible: this.platformVectorVisible,
      source: this.platformWaypointSource,
    });

    this.olMapView = new View({
      projection: MAP_PROJECTION,
      center: [0, 0],
      zoom: 5,
      minZoom: 1,
      maxZoom: 18,
    });

    this.mapContextMenu = new MapContextMenu({
      toggleTrackLabels: () => this.toggleTrackLabels(),
      document: document,
    });

    this.userStateService.aoi$.pipe(untilDestroyed(this)).subscribe((aoi) => {
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
        this.updateVectors();
      });
  }

  customLayers(): BaseLayer[] {
    return [];
  }

  ngOnInit() {
    this.map = new Map({
      target: this.target,
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine({ units: 'nautical' }),
        new MousePosition({
          coordinateFormat: createStringYX(4),
          projection: MAP_PROJECTION,
          className: 'custom-mouse-position',
          target: 'mousePositionDisplay',
        }),
      ]),
      layers: [
        new TileLayer({
          source: new StadiaMaps({
            layer: 'alidade_smooth_dark',
            retina: true,
          }),
        }),
        this.drawingLayer,
        this.aoiLayer,
        this.platformVectorLayer,
        this.platformWaypointLayer,
        ...this.customLayers(),
      ],
      view: this.olMapView,
    });

    // right click menu changes if user clicks on map vs a feature
    this.map?.getTargetElement().addEventListener('contextmenu', (event) => {
      event.preventDefault();

      this.mapContextMenu.createContextMenu(
        document,
        event.clientX,
        event.clientY,
      );
    });

    this.initButtonBar();
    this.initTerraDraw();
  }

  addButtonsToBar(): Control[] {
    return [];
  }

  toggleTrackLabels(): void {
    this.showTrackLabels = !this.showTrackLabels;
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');

    btnBar.addControl(
      new Toggle({
        title: 'Toggle Track Vectors',
        className: 'ol-vector-toggle',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M287.9 96L211.7 96C182.3 96 156.6 116.1 149.6 144.6L65.4 484.5C57.9 514.7 80.8 544 112 544L287.9 544L287.9 480C287.9 462.3 302.2 448 319.9 448C337.6 448 351.9 462.3 351.9 480L351.9 544L528 544C559.2 544 582.1 514.7 574.6 484.5L490.5 144.6C483.4 116.1 457.8 96 428.3 96L351.9 96L351.9 160C351.9 177.7 337.6 192 319.9 192C302.2 192 287.9 177.7 287.9 160L287.9 96zM351.9 288L351.9 352C351.9 369.7 337.6 384 319.9 384C302.2 384 287.9 369.7 287.9 352L287.9 288C287.9 270.3 302.2 256 319.9 256C337.6 256 351.9 270.3 351.9 288z"/></svg>`,
        active: this.platformVectorVisible,
        onToggle: (activate) => {
          this.platformVectorVisible = activate;
          this.platformVectorLayer.setVisible(this.platformVectorVisible);
        },
      }),
    );

    this.addButtonsToBar().forEach((control) => btnBar.addControl(control));
    this.map?.addControl(btnBar);
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
          [this.aoiValue.lon, this.aoiValue.lat] as Coordinate,
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

  get platformDataToDisplay() {
    return this.data;
  }

  updateVectors() {
    if (!this.platformWaypointLayer) return;

    this.platformVectorSource.clear();

    const features = this.data
      .filter(
        (platform) =>
          platform.waypoints !== undefined && platform.waypoints.length > 1,
      )
      .flatMap((platform) => {
        return this.geoJson.readFeature(
          lineString(
            platform.waypoints.map(
              (waypoint) => [waypoint.lon, waypoint.lat] as Coordinate,
            ),
          ),
        ) as Feature;
      });

    this.platformWaypointSource.addFeatures(features);
  }

  updateTracks() {
    if (!this.platformWaypointLayer) return;

    this.platformWaypointSource.clear();

    const features = this.data.flatMap((platform) => {
      return platform.waypoints.flatMap((waypoint, i) => {
        return this.createWaypointFeature(
          waypoint,
          platform,
          i == platform.waypoints.length - 1 ? platform.name : undefined,
        );
      });
    });

    this.platformWaypointSource.addFeatures(features);
  }

  createWaypointFeature(
    waypoint: Waypoint,
    platform: Platform,
    label?: string,
  ) {
    const pt = point([waypoint.lon, waypoint.lat], {}, { id: waypoint.id });
    const feature = this.geoJson.readFeature(pt) as Feature;

    const color = platform.color;

    feature.setStyle([
      new Styled.Style({
        image: new Styled.Circle({
          radius: 5,
          fill: new Styled.Fill({
            color: color,
          }),
          stroke: new Styled.Stroke({
            color: color,
            width: 1,
          }),
        }),
      }),
      new Styled.Style({
        text: this.showTrackLabels
          ? new Styled.Text({
              text: label,
              font: '12px sans-serif',
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
            })
          : undefined,
      }),
    ]);

    feature.set('label', label);

    return feature;
  }

  getColorIndex(platformId: string, friendly: boolean): number[] {
    const uid = '0000'.substr(String(platformId).length) + platformId;
    const hash =
      uid.charCodeAt(0) +
      uid.charCodeAt(1) * 3 +
      uid.charCodeAt(2) * 5 +
      uid.charCodeAt(3) * 7;
    return friendly
      ? GREEN_COLORS[hash % GREEN_COLORS.length]
      : RED_COLORS[hash % RED_COLORS.length];
  }

  destroyMap() {
    if (this.map) {
      this.aoiLayer.dispose();
      this.drawingLayer.dispose();
      this.map.dispose();
      this.map = undefined;
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }
}
