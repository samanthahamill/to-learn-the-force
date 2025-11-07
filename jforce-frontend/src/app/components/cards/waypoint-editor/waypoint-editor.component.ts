import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
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
import { Waypoint } from '../../../shared/types';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import * as Styled from 'ol/style';
import { addHours, MAP_PROJECTION } from '../../../shared/utils';
import CircleStyle from 'ol/style/Circle';
import { DrawWaypointsControl } from '../../panels/map/control/draw-waypoints-control.component';
import { Coordinate } from 'ol/coordinate';
import { BaseMapComponent } from '../../panels/map/base-map.component';

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
      projection: MAP_PROJECTION,
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
      className: 'ol-draw-waypoint-tool',
      // Ruler Icon
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/></svg>`,
      title: 'Draw Waypoint Tool',
      onDrawEnd: (points) => this.onDrawEnd(points),
    });

    this.renderWaypoints();
  }

  get platformName() {
    return this.waypointPlatformData?.platform.name;
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
    if (!this.reportLayer || this.waypointPlatformData === undefined) return;

    const features: any[] = [];
    this.waypoints.forEach((waypoint) => {
      const feature = this.createWaypointFeature(
        waypoint,
        this.waypointPlatformData!.platform,
        this.waypointPlatformData!.platform.name,
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
    const lastPoint: Waypoint | undefined =
      this.waypoints[waypoints.length - 1];
    const waypointLastIndex = waypoints.length - 1;

    const newCoordinates: Waypoint[] = points.map((point, i) => {
      return {
        lat: point[0],
        lon: point[1],
        alt: 0,
        speedKts: lastPoint?.speedKts ?? 0,
        datetime: !lastPoint?.datetime
          ? new Date().toISOString()
          : addHours(new Date(lastPoint.datetime), 1).toISOString(),
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
        this.waypointPlatformData?.platform.id &&
        platform.id !== this.waypointPlatformData?.platform.id,
    );
  }

  override destroyMap() {
    super.destroyMap();
    this.reportSource.dispose();
    this.reportLayer.dispose();
  }
}
