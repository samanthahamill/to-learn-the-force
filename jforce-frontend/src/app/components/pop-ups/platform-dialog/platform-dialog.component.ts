import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  PlatformEditorInformation,
  DialogEditorService,
} from '../../../services/dialog-editor.service';
import { UserStateService } from '../../../services/user-state.service';
import {
  addHours,
  createNewWaypointId,
  deepClone,
  MAP_PROJECTION,
  minusHours,
} from '../../../shared/utils';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Platform,
  PLATFORM_TYPE,
  PLATFORM_TYPE_OPTIONS,
  Waypoint,
} from '../../../shared/types';
import { CardComponent } from '../../cards/card.component';
import { BaseMapComponent } from '../../general/base-map.component';
import {
  faRemove,
  faCopy,
  faAdd,
  faObjectGroup,
} from '@fortawesome/free-solid-svg-icons';
import { Coordinate } from 'ol/coordinate';
import VectorLayer from 'ol/layer/Vector';
import { toFixed } from 'ol/math';
import VectorSource from 'ol/source/Vector';
import { DragWaypointsControl } from '../../panels/map/control/drag-waypoint-control.component';
import { DrawWaypointsControl } from '../../panels/map/control/draw-waypoints-control.component';
import { ColorPickerModule } from 'primeng/colorpicker';
import { formGroupWaypointToWaypointArray } from '../../../shared/create';
import { lineString } from '@turf/turf';
import { Feature } from 'ol';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-platform-dialog',
  imports: [
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
    ColorPickerModule,
  ],
  templateUrl: './platform-dialog.component.html',
  styleUrl: './platform-dialog.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlatformDialogComponent
  extends BaseMapComponent
  implements AfterViewInit
{
  private platformData: PlatformEditorInformation | undefined;
  private dialogEditorService = inject(DialogEditorService);

  maxDateTime: string;
  minDateTime: string;

  @Output() waypointPlatformDataUpdated =
    new EventEmitter<PlatformEditorInformation>();

  removeIcon = faRemove;
  copyIcon = faCopy;
  addIcon = faAdd;
  groupObject = faObjectGroup;

  platformTypeOptions = PLATFORM_TYPE_OPTIONS;

  reportSource: VectorSource = new VectorSource();
  reportLayer: VectorLayer;
  vectorSource: VectorSource = new VectorSource();
  vectorLayer: VectorLayer;
  private drawWaypointControl: DrawWaypointsControl;
  private dragWaypointControl: DragWaypointsControl;

  allowDraw: boolean;
  errorMessage: string | undefined;

  type: PLATFORM_TYPE | undefined = undefined;
  maxSpeed: number | undefined = undefined;
  maxZ: number | undefined = undefined;
  friendly: boolean | undefined = undefined;
  color: string | undefined = undefined;

  reportingFrequency: number | undefined = undefined;
  name: string | undefined = undefined;

  // add waypoint information
  latInput: number | undefined = undefined;
  lonInput: number | undefined = undefined;
  altInput: number | undefined = undefined;
  datetimeInput: string | undefined = undefined;
  speedInput: number | undefined = undefined;

  constructor() {
    super('mapContainerPlatform');

    this.maxDateTime = this.userStateService.maxDate;
    this.minDateTime = this.userStateService.minDate;

    this.userStateService.minDate$
      .pipe(untilDestroyed(this))
      .subscribe((val) => (this.minDateTime = val));

    this.userStateService.maxDate$
      .pipe(untilDestroyed(this))
      .subscribe((val) => (this.maxDateTime = val));

    this.name = this.platformData?.platform.name;
    this.maxSpeed = this.platformData?.platform.maxSpeed;
    this.maxZ = this.platformData?.platform.maxZ;
    this.friendly = this.platformData?.platform.friendly;
    this.color = this.platformData?.platform.color;
    this.type = this.platformData?.platform.type;
    this.reportingFrequency = this.platformData?.platform.reportingFrequency;

    this.reportSource = new VectorSource();
    this.reportLayer = new VectorLayer({
      source: this.reportSource,
    });
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });

    this.allowDraw = false;

    this.drawWaypointControl = new DrawWaypointsControl({
      className: 'ol-draw-waypoint-tool',
      // Ruler Icon
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z"/></svg>`,
      title: 'Draw Waypoint Tool',
      onDrawEnd: () => this.onDrawEnd(),
      onDrawNewWaypoint: (points) => this.onDrawNewWaypoint(points),
      onDrawStart: () => {
        this.updateToggles(true, 'DRAW');
      },
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
        this.updateToggles(false, 'DRAG');
        this.waypointPlatformDataUpdated.emit(this.platformData!);
      },
      onDrawStart: () => {
        this.updateToggles(true, 'DRAG');
      },
    });

    this.dialogEditorService.platformInformation$
      .pipe(untilDestroyed(this))
      .subscribe((info: PlatformEditorInformation | undefined) => {
        if (info !== undefined) {
          this.platformData = {
            platform: {
              ...info.platform,
              waypoints: deepClone(info.platform.waypoints),
            },
            platformIndex: info.platformIndex,
          };

          this.updateMap();
          this.openModal();
        }
      });

    this.updateMap();
  }

  updateToggles(editing: boolean, control: 'DRAG' | 'DRAW') {
    if (!editing) {
      this.dragWaypointControl.setDisable(false);
      this.drawWaypointControl.setDisable(false);
      return;
    }

    if (control == 'DRAG') {
      this.drawWaypointControl.setDisable(true);
    } else {
      this.dragWaypointControl.setDisable(true);
    }
  }

  updateData() {
    this.name = this.platformData?.platform.name;
    this.maxSpeed = this.platformData?.platform.maxSpeed;
    this.maxZ = this.platformData?.platform.maxZ;
    this.friendly = this.platformData?.platform.friendly;
    this.color = this.platformData?.platform.color;
    this.type = this.platformData?.platform.type;
    this.reportingFrequency = this.platformData?.platform.reportingFrequency;
  }

  ngAfterViewInit(): void {
    this.color = this.platformData?.platform.color;
  }

  override updateMap() {
    super.updateMap();
    this.renderWaypoints();
    this.renderVector();
    this.updateData();
  }

  override customLayers() {
    return [this.vectorLayer, this.reportLayer];
  }

  override addButtonsToBar() {
    return [this.drawWaypointControl, this.dragWaypointControl];
  }

  override get displayData() {
    return this.data.filter(
      (platform) =>
        this.platformData?.platform.id == undefined ||
        platform.id !== this.platformData.platform.id,
    );
  }

  override getWaypointTrack(platform: Platform): string | undefined {
    return this.platformData?.platform.id == undefined ||
      platform.id !== this.platformData?.platform.id
      ? 'gray'
      : this.platform?.color;
  }

  get platform(): Platform | undefined {
    return this.platformData?.platform;
  }

  get platformType(): PLATFORM_TYPE {
    return this.platformData!.platform.type;
  }

  get platformName(): string {
    return this.platformData?.platform.name ?? '';
  }

  get waypoints(): Waypoint[] {
    return this.platformData?.platform.waypoints ?? [];
  }

  platformDataUpdated(waypointPlatformData: PlatformEditorInformation) {
    this.platformData = {
      ...this.platformData!,
      platform: {
        ...this.platformData!.platform,
        waypoints: waypointPlatformData.platform.waypoints,
      },
    };
  }

  renderWaypoints() {
    if (!this.reportLayer || this.platformData === undefined) return;

    this.reportSource.clear();

    const features = this.waypoints.map((waypoint) => {
      const feature = this.createWaypointFeature(
        waypoint,
        this.platformData!.platform,
        this.name,
        this.color,
      );

      feature.set('draggable', true);
      return feature;
    });

    this.reportSource.addFeatures(features);
  }

  renderVector() {
    if (!this.vectorLayer || this.waypoints.length < 2) return;

    this.vectorSource.clear();

    const feature = this.geoJson.readFeature(
      lineString(
        this.waypoints.map(
          (waypoint) => [waypoint.lon, waypoint.lat] as Coordinate,
        ),
      ),
    ) as Feature;
    feature.set('draggable', false);

    this.vectorSource.addFeature(feature);
  }

  onDrawEnd() {
    this.updateToggles(false, 'DRAW');
    this.updateMap();
  }

  onDrawNewWaypoint(points: Coordinate[]) {
    const waypoints = this.waypoints;
    const lastPoint: Waypoint | undefined =
      this.waypoints[waypoints.length - 1];

    const newCoordinates: Waypoint[] = points.map((point) => {
      return {
        id: createNewWaypointId(
          this.platformData?.platform.id ?? this.platformName ?? 'platform',
          this.waypoints ?? [],
        ),
        lat: point[0],
        lon: point[1],
        z: 0,
        speedKts: lastPoint?.speedKts ?? 0,
        datetime: !lastPoint?.datetime
          ? new Date()
          : lastPoint.datetime < minusHours(new Date(this.maxDateTime), 1)
            ? addHours(new Date(lastPoint.datetime), 1)
            : lastPoint.datetime,
        index: waypoints.length,
      } as Waypoint;
    });

    this.waypoints.push(...newCoordinates);
    this.renderVector();
  }

  dragPointOnMap(coord: Coordinate, waypointId: string) {
    if (waypointId && waypointId !== '' && this.platformData) {
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

      this.platformData = {
        ...this.platformData,
        platform: {
          ...this.platformData.platform,
          waypoints: newCoordinates,
        },
      };

      this.renderVector();
    }
  }

  ngModelChange(event: any) {
    this.renderWaypoints();
  }

  // non-map functions

  addWaypoint() {
    if (
      this.platformData?.platform &&
      this.latInput &&
      this.lonInput &&
      this.speedInput &&
      this.altInput &&
      this.datetimeInput
    ) {
      if (this.waypoints === undefined) {
        this.platformData.platform.waypoints = [
          {
            id: createNewWaypointId(
              this.platformData?.platform.id ?? this.platformName ?? 'platform',
              this.waypoints,
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
            this.platformData?.platform.id ?? this.platformName ?? 'platform',
            this.waypoints,
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

  ///

  private validate(): boolean {
    if (this.platformData === undefined) {
      return false;
    }

    // ensure all fields are filled
    if (this.color === undefined) {
      this.errorMessage = `Platform color cannot be undefined. Please set to a valid value before proceeding.`;
      return false;
    }
    if (this.name === undefined || this.name === '') {
      this.errorMessage = `Platform name cannot be undefined. Please set to a valid value before proceeding.`;
      return false;
    }
    if (
      this.type === 'AIR' &&
      (this.maxZ === undefined || Number.isNaN(this.maxZ))
    ) {
      this.errorMessage = `Platform color cannot be undefined for an air platform. Please set to a valid value before proceeding.`;
      return false;
    }
    if (
      this.type !== 'GROUND' &&
      (this.maxZ === undefined || Number.isNaN(this.maxZ))
    ) {
      this.errorMessage = `Platform ${this.type == 'AIR' ? 'Alt' : 'Depth'} cannot be undefined for a ${this.type} platform. Please set to a valid value before proceeding.`;
      return false;
    }
    if (
      this.reportingFrequency === undefined ||
      Number.isNaN(this.reportingFrequency)
    ) {
      this.errorMessage = `Platform reporting frequency cannot be undefined. Please set to a valid value before proceeding.`;
      return false;
    }

    const invalidWapoint = this.waypoints.find(
      (waypoint) =>
        waypoint.lat == undefined ||
        Number.isNaN(waypoint.lat) ||
        waypoint.lon == undefined ||
        Number.isNaN(waypoint.lon) ||
        waypoint.speedKts == undefined ||
        Number.isNaN(waypoint.speedKts) ||
        waypoint.datetime == undefined,
    );

    if (invalidWapoint) {
      this.errorMessage = `Waypoint with index ${invalidWapoint.index} has invalid entries. Please fix these before saving.`;
      return false;
    }

    const earliestTime = new Date(this.minDateTime);
    const latestTime = new Date(this.maxDateTime);

    for (let waypoint of this.waypoints) {
      if (waypoint.datetime < earliestTime) {
        this.errorMessage = `Waypoint with index ${waypoint.index} has a date that is earlier than the scenario start time.`;
        return false;
      }
      if (waypoint.datetime > latestTime) {
        this.errorMessage = `Waypoint with index ${waypoint.index} has a date that is later than the scenario end time.`;
        return false;
      }
    }

    this.errorMessage = undefined;
    return true;
  }

  closeAndSaveModal() {
    if (this.validate()) {
      // TODO validate everything
      // if not valid, display error message
      // if valid, update user service
      const platform = this.platformData!.platform;

      this.userStateService.updatePlatform(this.platformData!.platformIndex, {
        ...platform, // handles 'id' and 'readonly' which should not be changed
        name: this.name ?? platform.name,
        type: this.type ?? platform.type,
        maxSpeed: this.maxSpeed ?? platform.maxSpeed,
        maxZ: this.maxZ ?? platform.maxZ,
        friendly: this.friendly ?? platform.friendly,
        color: this.color ?? platform.color,
        waypoints: this.waypoints
          ? formGroupWaypointToWaypointArray(this.waypoints)
          : formGroupWaypointToWaypointArray(platform.waypoints),
        reportingFrequency:
          this.reportingFrequency ?? platform.reportingFrequency,
      } as Platform);
      this.closeModal();
    }
  }

  openModal() {
    $('#platformModal').modal('show');
  }

  closeModal() {
    this.drawWaypointControl.deactivate();
    this.drawWaypointControl.setActive(false);
    this.dragWaypointControl.deactivate();
    this.dragWaypointControl.setActive(false);
    $('#platformModal').modal('hide');
  }

  override destroyMap() {
    this.drawWaypointControl.onDestroy();
    this.dragWaypointControl.onDestroy();

    super.destroyMap();
    this.reportSource.dispose();
    this.reportLayer.dispose();
  }
}
