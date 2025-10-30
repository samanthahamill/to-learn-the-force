import {
  Component,
  inject,
  Input,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WaypointEditorInformation } from '../../../services/waypoint-editor.service';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRemove,
  faCopy,
  faAdd,
  faObjectGroup,
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AOIType, Waypoint } from '../../../shared/types';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import * as Styled from 'ol/style';
import {
  defaults as defaultControls,
  MousePosition,
  ScaleLine,
} from 'ol/control.js';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { createStringYX } from '../../../shared/utils';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';
import { Draw, Modify, Snap } from 'ol/interaction';
import { circle, point } from '@turf/turf';
import CircleStyle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { UserStateService } from '../../../services/user-state.service';
import GeoJSON from 'ol/format/GeoJSON';
import { DrawWaypointsControl } from '../../panels/map/control/draw-waypoints-control.component';
import { Coordinate } from 'ol/coordinate';
import { BaseMapComponent } from '../../panels/map/base-map.component';

const projection = 'EPSG:4326';

@UntilDestroy()
@Component({
  selector: 'app-waypoint-editor',
  imports: [
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './waypoint-editor.component.html',
  styleUrl: './waypoint-editor.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class WaypointEditorComponent extends BaseMapComponent {
  @Input() waypointPlatformData: WaypointEditorInformation | undefined;

  removeIcon = faRemove;
  copyIcon = faCopy;
  addIcon = faAdd;

  reportSource: VectorSource = new VectorSource();
  reportLayer: VectorLayer;
  private drawWaypointControl: DrawWaypointsControl;

  allowDraw: boolean;
  theresAnError: boolean;

  latInput: number | undefined = undefined;
  lonInput: number | undefined = undefined;
  altInput: number | undefined = undefined;
  datetimeInput: string | undefined = undefined;
  speedInput: number | undefined = undefined;

  constructor() {
    super('mapContainerWaypoints');

    this.reportSource = new VectorSource();
    this.reportLayer = new VectorLayer({
      source: this.reportSource,
    });

    this.olMapView = new View({
      projection: projection,
      center: [0, 0],
      zoom: 5,
      minZoom: 1,
      maxZoom: 18,
    });

    this.allowDraw = false;
    this.theresAnError = false;

    this.userStateService.aoi$.pipe(untilDestroyed(this)).subscribe((aoi) => {
      if (aoi !== undefined && aoi != this.aoiValue && this.aoiLayer) {
        this.aoiValue = aoi;
        this.renderAOI();
      }
    });

    this.drawWaypointControl = new DrawWaypointsControl({
      onDrawEnd: (points) => this.onDrawEnd(points),
    });

    this.renderWaypoints();
  }

  get platformName() {
    return this.waypointPlatformData?.platformName;
  }

  get waypoints(): Waypoint[] {
    return this.waypointPlatformData?.waypoints ?? [];
  }

  override customLayers() {
    return [this.reportLayer];
  }

  groupObject = faObjectGroup;

  override addButtonsToBar() {
    return [this.drawWaypointControl];
  }

  renderWaypoints() {
    if (!this.reportLayer) return;

    const features: any[] = [];
    this.waypoints.forEach((waypoint) => {
      const feature = this.createWaypointFeature(
        waypoint,
        this.platformName ?? '',
        this.waypointPlatformData?.platformIndex.toString() ?? '',
      );
      features.push(feature);
    });

    this.reportSource.addFeatures(features);
  }

  // createWaypointFeature(waypoint: Waypoint) {
  //   const pt = point(
  //     [waypoint.lon, waypoint.lat],
  //     { data: waypoint },
  //     { id: waypoint.index },
  //   );

  //   const feature = new Feature(
  //     new Point(fromLonLat([waypoint.lon, waypoint.lat])),
  //   );
  //   const ptStyle = this.getStyle();
  //   feature.setStyle(ptStyle);

  //   const label = `Waypoint ${waypoint.index}\nloc: [${(waypoint.lon, waypoint.lat)}];\nalt: ${waypoint.alt}\nspeed:${waypoint.speedKts}`;
  //   ptStyle.getText()?.setText(label);
  //   return feature;
  // }

  getStyle() {
    return new Style({
      text: new Styled.Text({
        font: '12px monospace',
        offsetX: 5,
        offsetY: 5,
        textAlign: 'left',
        overflow: true,
        fill: new Fill({ color: 'red' }),
      }),
      image: new CircleStyle({ radius: 3, fill: new Fill({ color: 'red' }) }),
      stroke: new Styled.Stroke({ width: 1, color: 'red' }),
    });
  }

  // non-map functions

  onDrawEnd(points: Coordinate[]) {
    const waypoints = this.waypoints;
    const lastPoint = this.waypoints[waypoints.length - 1];
    const waypointLastIndex = waypoints.length - 1;

    const newCoordinates: Waypoint[] = points.map((point, i) => {
      return {
        lat: point[0],
        lon: point[1],
        alt: 0,
        speedKts: lastPoint.speedKts,
        datetime: new Date(lastPoint.datetime).toISOString(),
        index: waypointLastIndex + i,
      } as Waypoint;
    });

    this.waypoints.push(...newCoordinates);
  }

  addWaypoint() {
    if (
      this.waypointPlatformData &&
      this.latInput &&
      this.lonInput &&
      this.speedInput &&
      this.altInput &&
      this.datetimeInput
    ) {
      if (this.waypoints === undefined) {
        this.waypointPlatformData.waypoints = [
          {
            index: 0,
            lat: this.latInput,
            lon: this.lonInput,
            alt: this.altInput,
            speedKts: this.speedInput,
            datetime: this.datetimeInput,
          },
        ];
      } else {
        this.waypoints.push({
          index: this.waypoints.length,
          lat: this.latInput,
          lon: this.lonInput,
          alt: this.altInput,
          speedKts: this.speedInput,
          datetime: this.datetimeInput,
        });
      }
    }
  }

  deleteWaypoint(index: number) {
    this.waypoints?.splice(index, 1);
    this.shiftWaypoints();
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.waypoints) {
      moveItemInArray(this.waypoints, event.previousIndex, event.currentIndex);
      // TODO add other logic that fixes drag/drop with times

      this.shiftWaypoints();
    }
  }

  shiftWaypoints() {
    this.waypoints?.forEach((waypoint, i) => (waypoint.index = i));
  }

  duplicateWaypoint(index: number) {
    if (this.waypoints) {
      const duplicateWaypoint = { ...this.waypoints[index] };
      this.waypoints.splice(index, 0, duplicateWaypoint);
      this.shiftWaypoints();
    }
  }

  validateWaypointValues() {
    if (this.waypointPlatformData?.waypoints == undefined) return;
    this.theresAnError = false;

    for (const waypoint of this.waypointPlatformData?.waypoints) {
      if (
        waypoint === null ||
        waypoint.alt == null ||
        waypoint.lat == null ||
        waypoint.lon == null ||
        waypoint.datetime == null ||
        waypoint.speedKts == null
      ) {
        this.theresAnError = true;
        break;
      }
    }
  }

  override get platformDataToDisplay() {
    return this.data.filter(
      (platform) =>
        this.waypointPlatformData?.platformId &&
        platform.id != this.waypointPlatformData?.platformId,
    );
  }

  override getColorIndex(platformId: string): number[] {
    return [123, 123, 123];
  }

  override destroyMap() {
    super.destroyMap();
    this.reportSource.dispose();
    this.reportLayer.dispose();
  }
}
