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
import {
  addHours,
  createNewWaypointId,
  deepClone,
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
import { FeatureLike } from 'ol/Feature';
import { MapContextMenu } from '../../panels/map/menu/map-context-menu.component';
import { ContextMenu } from '../../panels/map/menu/context-menu.component';
import { FeatureContextMenu } from '../../panels/map/menu/feature-context-menu.component';
import { DRAW_WAYPOINT_ICON, HEXAGON_NODE_ICON } from '../../../shared/icons';

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
  private featureContextMenu: FeatureContextMenu;

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

    this.featureContextMenu = new FeatureContextMenu({
      document: document,
      deleteWaypoint: () => {
        // TODO implement me
      },
    });

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
      html: DRAW_WAYPOINT_ICON,
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
      html: HEXAGON_NODE_ICON,
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

  ////////////// OVERRIDEN METHODS \\\\\\\\\\\\\\\\

  override ngOnInit() {
    super.ngOnInit();
    // right click menu changes if user clicks on map vs a feature
    this.map?.getTargetElement().addEventListener('contextmenu', (event) => {
      event.preventDefault();

      this.featureContextMenu.createContextMenu(
        document,
        event.clientX,
        event.clientY,
      );
    });
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

  override getContextMenu(): ContextMenu {
    return this.featureContextMenu;
  }

  ////////////// GET METHODS \\\\\\\\\\\\\\\\

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

  ////////////// CUSTOM METHODS \\\\\\\\\\\\\\\\

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

  ////////////// NON-MAP METHODS \\\\\\\\\\\\\\\\

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

  ////////////// VALIDATION AND MODAL METHODS \\\\\\\\\\\\\\\\

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
