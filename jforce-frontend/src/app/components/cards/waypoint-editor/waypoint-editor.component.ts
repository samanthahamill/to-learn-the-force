import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
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
import { Waypoint } from '../../../shared/types';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import View from 'ol/View';
import * as Styled from 'ol/style';
import {
  addHours,
  createNewWaypointId,
  MAP_PROJECTION,
} from '../../../shared/utils';
import CircleStyle from 'ol/style/Circle';
import { DrawWaypointsControl } from '../../panels/map/control/draw-waypoints-control.component';
import { Coordinate } from 'ol/coordinate';
import { BaseMapComponent } from '../../general/base-map.component';
import { DragWaypointsControl } from '../../panels/map/control/drag-waypoint-control.component';
import { toFixed } from 'ol/math';

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
  @Output() waypointPlatformDataUpdated =
    new EventEmitter<WaypointEditorInformation>();

  removeIcon = faRemove;
  copyIcon = faCopy;
  addIcon = faAdd;
  groupObject = faObjectGroup;

  reportSource: VectorSource = new VectorSource();
  reportLayer: VectorLayer;
  private drawWaypointControl: DrawWaypointsControl;
  private dragWaypointControl: DragWaypointsControl;

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

    this.allowDraw = false;
    this.theresAnError = false;

    this.drawWaypointControl = new DrawWaypointsControl({
      className: 'ol-draw-waypoint-tool',
      // Ruler Icon
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/></svg>`,
      title: 'Draw Waypoint Tool',
      onDrawEnd: (points) => this.onDrawEnd(points),
      onDrawNewWaypoint: (points) => this.onDrawEnd(points),
    });
    this.dragWaypointControl = new DragWaypointsControl({
      className: 'ol-drag-waypoint-control',
      // TODO possibly find a better svg - this is hexagon nodes icon
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M344 170.6C362.9 161.6 376 142.3 376 120C376 89.1 350.9 64 320 64C289.1 64 264 89.1 264 120C264 142.3 277.1 161.6 296 170.6L296 269.4C293.2 270.7 290.5 272.3 288 274.1L207.9 228.3C209.5 207.5 199.3 186.7 180 175.5C153.2 160 119 169.2 103.5 196C88 222.8 97.2 257 124 272.5C125.3 273.3 126.6 274 128 274.6L128 365.4C126.7 366 125.3 366.7 124 367.5C97.2 383 88 417.2 103.5 444C119 470.8 153.2 480 180 464.5C199.3 453.4 209.4 432.5 207.8 411.7L258.3 382.8C246.8 371.6 238.4 357.2 234.5 341.1L184 370.1C181.4 368.3 178.8 366.8 176 365.4L176 274.6C178.8 273.3 181.5 271.7 184 269.9L264.1 315.7C264 317.1 263.9 318.5 263.9 320C263.9 342.3 277 361.6 295.9 370.6L295.9 469.4C277 478.4 263.9 497.7 263.9 520C263.9 550.9 289 576 319.9 576C350.8 576 375.9 550.9 375.9 520C375.9 497.7 362.8 478.4 343.9 469.4L343.9 370.6C346.7 369.3 349.4 367.7 351.9 365.9L432 411.7C430.4 432.5 440.6 453.3 459.8 464.5C486.6 480 520.8 470.8 536.3 444C551.8 417.2 542.6 383 515.8 367.5C514.5 366.7 513.1 366 511.8 365.4L511.8 274.6C513.2 274 514.5 273.3 515.8 272.5C542.6 257 551.8 222.8 536.3 196C520.8 169.2 486.8 160 460 175.5C440.7 186.6 430.6 207.5 432.2 228.3L381.6 257.2C393.1 268.4 401.5 282.8 405.4 298.9L456 269.9C458.6 271.7 461.2 273.2 464 274.6L464 365.4C461.2 366.7 458.5 368.3 456 370L375.9 324.2C376 322.8 376.1 321.4 376.1 319.9C376.1 297.6 363 278.3 344.1 269.3L344.1 170.5z"/></svg>`,
      title: 'Drag Waypoints',
      updateCoordinate: (points, waypointId) => {
        this.dragPointOnMap(points, waypointId);
      },
      onUpdateFinished: () => {
        this.waypointPlatformDataUpdated.emit(this.waypointPlatformData!);
      },
    });

    this.renderWaypoints();
  }

  override ngOnInit() {
    super.ngOnInit();
  }

  get platformId() {
    return this.waypointPlatformData?.platform.id;
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

  override addButtonsToBar() {
    return [this.drawWaypointControl, this.dragWaypointControl];
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

  onDrawEnd(points: Coordinate[]) {
    const waypoints = this.waypoints;
    const lastPoint: Waypoint | undefined =
      this.waypoints[waypoints.length - 1];
    const waypointLastIndex = waypoints.length - 1;

    const newCoordinates: Waypoint[] = points.map((point, i) => {
      return {
        id: createNewWaypointId(
          this.platformId ?? this.platformName ?? 'platform',
          this.waypointPlatformData?.waypoints ?? [],
        ),
        lat: point[0],
        lon: point[1],
        z: 0,
        speedKts: lastPoint?.speedKts ?? 0,
        datetime: !lastPoint?.datetime
          ? new Date()
          : addHours(new Date(lastPoint.datetime), 1),
        index: waypointLastIndex + i,
      } as Waypoint;
    });

    this.waypoints.push(...newCoordinates);
  }

  dragPointOnMap(coord: Coordinate, waypointId: string) {
    if (waypointId && waypointId !== '' && this.waypointPlatformData) {
      const newCoordinates = this.waypoints.map((point) => {
        if (point.id === waypointId) {
          return {
            ...point,
            lat: toFixed(coord[1], 3),
            lon: toFixed(coord[0], 3),
          } as Waypoint;
        }
        return point;
      });

      this.waypointPlatformData = {
        ...this.waypointPlatformData,
        waypoints: newCoordinates,
      };
    }
  }

  // non-map functions

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
            id: createNewWaypointId(
              this.platformId ?? this.platformName ?? 'platform',
              this.waypointPlatformData?.waypoints ?? [],
            ),
            index: 0,
            lat: this.latInput,
            lon: this.lonInput,
            z: this.altInput,
            speedKts: this.speedInput,
            datetime: new Date(this.datetimeInput),
          },
        ];
      } else {
        this.waypoints.push({
          id: createNewWaypointId(
            this.platformId ?? this.platformName ?? 'platform',
            this.waypointPlatformData?.waypoints ?? [],
          ),
          index: this.waypoints.length,
          lat: this.latInput,
          lon: this.lonInput,
          z: this.altInput,
          speedKts: this.speedInput,
          datetime: new Date(this.datetimeInput),
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
        waypoint.z == null ||
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
    this.drawWaypointControl.onDestroy();
    this.dragWaypointControl.onDestroy();

    super.destroyMap();
    this.reportSource.dispose();
    this.reportLayer.dispose();
  }
}
