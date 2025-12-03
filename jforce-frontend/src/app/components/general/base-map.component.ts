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
import { UserStateService } from '../../services/user-state.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AOIType, Platform, Waypoint } from '../../shared/types';
import { fromLonLat, getUserProjection, Projection, toLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { createStringYX, MAP_PROJECTION } from '../../shared/utils';
import Feature from 'ol/Feature';
import { TerraDraw, TerraDrawPointMode } from 'terra-draw';
import { TerraDrawOpenLayersAdapter } from 'terra-draw-openlayers-adapter';
import { point, polygon, lineString, circle, ellipse } from '@turf/turf';
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import Toggle from 'ol-ext/control/Toggle';
import { DOT_CIRCLE_ICON, RULER_ICON, TRACK_ICON } from '../../shared/icons';
import { MeasurementToolControl } from '../panels/map/control/measurement-tool.component';
import { Geometry } from 'ol/geom';
import { environment } from '../../../environments/environment';

// import { FeatureId } from 'terra-draw/dist/store/store';
export type FeatureId = string | number;

const aoiStyle = new Style({
  stroke: new Styled.Stroke({ color: 'yellow', width: 2 }),
});

const vectorStyle = new Style({
  stroke: new Styled.Stroke({ color: 'white', width: 2 }),
});

const ellipseStyle = new Style({
  stroke: new Styled.Stroke({ color: '#e9e8c2ff', width: 2 }),
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

  private measureToolControl: MeasurementToolControl;
  platformWaypointSource: VectorSource = new VectorSource();
  platformWaypointLayer: VectorLayer;
  platformVectorSource: VectorSource = new VectorSource();
  platformVectorLayer: VectorLayer;
  waypointEllipsisSource: VectorSource = new VectorSource();
  waypointEllipsisLayer: VectorLayer;

  terraDraw: TerraDraw | undefined;
  terraDrawOpenLayerAdapter: TerraDrawOpenLayersAdapter | undefined;
  fitExtent: Extent | undefined;

  target: string;
  mouseTarget: string;

  showTrackLabels: boolean;
  platformVectorVisible: boolean;
  waypointEllipseVisible: boolean;

  constructor(target: string, mouseTarget: string) {
    this.target = target;
    this.mouseTarget = mouseTarget;
    this.showTrackLabels = true;
    this.platformVectorVisible = true;
    this.waypointEllipseVisible = false;

    this.measureToolControl = new MeasurementToolControl({
      className: 'ol-measure-tool',
      html: RULER_ICON,
      title: 'Measure Tool',
      onToggle: () => {
        // internally handled
      },
    });

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

    this.platformVectorSource = new VectorSource();
    this.platformVectorLayer = new VectorLayer({
      visible: this.platformVectorVisible,
      source: this.platformVectorSource,
      style: vectorStyle,
    });

    this.waypointEllipsisSource = new VectorSource();
    this.waypointEllipsisLayer = new VectorLayer({
      visible: this.waypointEllipseVisible,
      source: this.waypointEllipsisSource,
      style: ellipseStyle,
    });

    this.olMapView = new View({
      projection: MAP_PROJECTION,
      center: [0, 0],
      zoom: 5,
      minZoom: 1,
      maxZoom: 18,
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
        this.data = input?.scenarioInput?.platforms ?? [];
        this.updateMap();
      });
  }

  ngOnInit() {
    this.map = new Map({
      target: this.target,
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine({ units: 'nautical' }),
        new MousePosition({
          coordinateFormat: createStringYX(4),
          projection: MAP_PROJECTION,
          className: `${this.target}-custom-mouse-position`,
          target: this.mouseTarget,
        }),
      ]),
      layers: [
        !environment.production || environment.apiKey === ''
          ? new TileLayer({ source: new OSM() })
          : new TileLayer({
              source: new StadiaMaps({
                layer: 'alidade_smooth_dark',
                retina: true,
                apiKey: environment.apiKey,
              }),
            }),
        this.drawingLayer,
        this.aoiLayer,
        this.waypointEllipsisLayer,
        this.platformVectorLayer,
        this.platformWaypointLayer,
        ...this.customLayers(),
      ],
      view: this.olMapView,
    });

    this.initButtonBar();
    this.initTerraDraw();
  }

  customLayers(): BaseLayer[] {
    return [];
  }

  addButtonsToBar(): Control[] {
    return [];
  }

  toggleTrackLabels(): void {
    this.showTrackLabels = !this.showTrackLabels;
    this.updateTracks();
  }

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');

    btnBar.addControl(
      new Toggle({
        title: 'Toggle Track Vectors',
        className: 'ol-vector-toggle',
        html: TRACK_ICON,
        active: this.platformVectorVisible,
        onToggle: (activate) => {
          this.platformVectorVisible = activate;
          this.platformVectorLayer.setVisible(this.platformVectorVisible);
        },
      }),
    );

    btnBar.addControl(
      new Toggle({
        title: 'Toggle Ellipsis',
        className: 'ol-ellipse-toggle',
        html: DOT_CIRCLE_ICON,
        active: this.waypointEllipseVisible,
        onToggle: (activate) => {
          this.toggleEllipsis(activate);
        },
      }),
    );

    btnBar.addControl(this.measureToolControl);

    this.addButtonsToBar().forEach((control) => btnBar.addControl(control));
    this.map?.addControl(btnBar);
  }

  toggleEllipsis(activate: boolean) {
    this.waypointEllipseVisible = activate;
    this.waypointEllipsisLayer.setVisible(this.waypointEllipseVisible);
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

  get displayData() {
    return this.data;
  }

  updateMap() {
    this.updateVectors();
    this.updateTracks();
    this.updateEllipses();
  }

  updateVectors() {
    if (!this.platformVectorLayer) return;

    this.platformVectorSource.clear();

    const features = this.displayData
      .filter(
        (platform) =>
          platform.waypoints !== undefined && platform.waypoints.length > 1,
      )
      .flatMap((platform) => {
        const feature = this.geoJson.readFeature(
          lineString(
            platform.waypoints.map(
              (waypoint) => [waypoint.lon, waypoint.lat] as Coordinate,
            ),
          ),
        ) as Feature;
        feature.set('draggable', false);

        return feature;
      });

    this.platformVectorSource.addFeatures(features);
  }

  updateTracks() {
    if (!this.platformWaypointLayer) return;

    this.platformWaypointSource.clear();

    const features = this.displayData.flatMap((platform) => {
      return platform.waypoints.flatMap((waypoint, i) => {
        return this.createWaypointFeature(
          waypoint,
          platform,
          i == platform.waypoints.length - 1 ? platform.name : undefined,
          this.getWaypointTrack(platform),
        );
      });
    });

    this.platformWaypointSource.addFeatures(features);
  }

  /**
   * Created so that waypoint colors can be overrided if need be. Otherwise returns the platform color.
   */
  getWaypointTrack(platform: Platform): string | undefined {
    return platform.color;
  }

  createWaypointFeature(
    waypoint: Waypoint,
    platform: Platform,
    label?: string,
    presetColor?: string,
  ) {
    const pt = point([waypoint.lon, waypoint.lat], {}, { id: waypoint.id });
    const feature = this.geoJson.readFeature(pt) as Feature;

    const color = presetColor ?? platform.color;

    const isLastWaypoint: boolean =
      waypoint.index === platform.waypoints.length - 1;

    feature.setStyle([
      new Styled.Style({
        image: new Styled.Circle({
          radius: 5,
          fill: new Styled.Fill({
            color: color,
          }),
          stroke: new Styled.Stroke({
            color: isLastWaypoint ? 'white' : color,
            width: 2,
          }),
        }),
      }),
      new Styled.Style({
        text:
          this.showTrackLabels && isLastWaypoint
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

    feature.set('draggable', false);
    feature.set('label', label);

    return feature;
  }

  updateEllipses() {
    if (!this.waypointEllipsisLayer) return;

    this.waypointEllipsisSource.clear();

    const features = this.displayData.flatMap((platform) => {
      return platform.waypoints.flatMap((waypoint) => {
        const pt = point(
          [waypoint.lon, waypoint.lat] as Coordinate,
          {},
          { id: `point-${waypoint.id}` },
        );
        const circleType = ellipse(pt, waypoint.smin, waypoint.smaj, {
          steps: 180,
          units: 'kilometers',
          angle: waypoint.orientation,
          properties: { data: waypoint, id: `ellipse-${waypoint.id}` },
        });

        const feature = this.geoJson.readFeature(
          circleType,
        ) as Feature<Geometry>;
        feature.setStyle(
          new Styled.Style({
            stroke: new Styled.Stroke({ color: '#e9e8c2ff', width: 1 }),
            image: new Styled.Circle({
              radius: 120,
              fill: new Styled.Fill({ color: '#e9e8c2ff' }),
            }),
          }),
        );

        feature.set('draggable', false);

        return feature;
      });
    });

    this.waypointEllipsisSource.addFeatures(features);
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
