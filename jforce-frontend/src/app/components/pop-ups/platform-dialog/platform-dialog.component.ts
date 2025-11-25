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
  createFormDateString,
  createISODateFromFormString,
  createNewWaypointId,
  deepClone,
  minusHours,
} from '../../../shared/utils';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Platform,
  PLATFORM_TYPE,
  PLATFORM_TYPE_OPTIONS,
  FormPlatform,
  ValidatedPlatform,
  ValidatedWaypoint,
  Waypoint,
  FormWaypoint,
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
import {
  formGroupWaypointToWaypointArray,
  formPlatformToPlatform,
  formWaypointToWaypoint,
} from '../../../shared/create';
import { ellipse, lineString, point } from '@turf/turf';
import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import * as Styled from 'ol/style';
import { FeatureContextMenu } from '../../panels/map/menu/feature-context-menu.component';
import { DRAW_WAYPOINT_ICON, HEXAGON_NODE_ICON } from '../../../shared/icons';
import { ToastService } from '../../../services/toast.service';
import { Geometry } from 'ol/geom';

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
    NgClass,
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
  private toastSerivce = inject(ToastService);

  @Output() waypointPlatformDataUpdated =
    new EventEmitter<PlatformEditorInformation>();

  removeIcon = faRemove;
  copyIcon = faCopy;
  addIcon = faAdd;
  groupObject = faObjectGroup;

  platformTypeOptions = PLATFORM_TYPE_OPTIONS;

  maxDateTime: string;
  minDateTime: string;

  allowDraw: boolean;
  errorMessage: string | undefined;

  private localReportSource: VectorSource;
  private localReportLayer: VectorLayer;
  private localVectorSource: VectorSource;
  private localVectorLayer: VectorLayer;
  private localEllipsisSource: VectorSource;
  private localEllipsisLayer: VectorLayer;
  private drawWaypointControl: DrawWaypointsControl;
  private dragWaypointControl: DragWaypointsControl;
  private featureContextMenu: FeatureContextMenu;

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
  zInput: number | undefined = undefined;
  datetimeInput: string | undefined = undefined;
  speedInput: number | undefined = undefined;
  smajInput: number | undefined = undefined;
  sminInput: number | undefined = undefined;
  orientationInput: number | undefined = undefined;

  // will hold error messages for invalid values
  validatedInput: ValidatedPlatform = {};
  validatedWaypointCreation: ValidatedWaypoint = {};

  constructor() {
    super('mapContainerPlatform', 'platformMousePositionDisplay');

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

    this.featureContextMenu = new FeatureContextMenu({
      document: document,
      deleteWaypoint: (feature: FeatureLike) => {
        // TODO implement me
        const index = feature.getId()?.toString().split('-').at(-1);

        if (index && Number(index)) {
          // confirmation message ?
          this.deleteWaypoint(Number(index));
        } else {
          this.toastSerivce.showErrorMessage(
            'Invalid feature',
            'The selected feature could not be deleted',
          );
          console.warn(
            `The selected feature with id ${feature.getId()} could not be deleted. Index was found to be ${index}`,
          );
        }
      },
    });

    this.localReportSource = new VectorSource();
    this.localReportLayer = new VectorLayer({
      source: this.localReportSource,
    });
    this.localVectorSource = new VectorSource();
    this.localVectorLayer = new VectorLayer({
      source: this.localVectorSource,
    });
    this.localEllipsisSource = new VectorSource();
    this.localEllipsisLayer = new VectorLayer({
      source: this.localEllipsisSource,
      visible: this.waypointEllipseVisible,
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
              waypoints: info.platform.waypoints.map((waypoint) => {
                return { ...waypoint };
              }),
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
      const pixel = this.map!.getEventPixel(event);
      const feature =
        this.map!.forEachFeatureAtPixel(pixel, (feature) => feature) || '';

      if (
        feature &&
        (feature as FeatureLike).getId()?.toString().split('-waypoint')[0] ==
          this.platform?.id
      ) {
        this.featureContextMenu.createContextMenuForFeature(
          document,
          event.clientX,
          event.clientY,
          feature,
        );
      }
    });
  }

  override updateMap() {
    super.updateMap();
    this.renderLocalEllipsis();
    this.renderLocalWaypoints();
    this.renderLocalVector();
    this.updateData();
  }

  override customLayers() {
    return [
      this.localEllipsisLayer,
      this.localVectorLayer,
      this.localReportLayer,
    ];
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

  override toggleEllipsis(activated: boolean) {
    super.toggleEllipsis(activated);
    this.localEllipsisLayer.setVisible(activated);
  }

  ////////////// GET METHODS \\\\\\\\\\\\\\\\

  get platform(): FormPlatform | undefined {
    return this.platformData?.platform;
  }

  get platformType(): PLATFORM_TYPE {
    return this.platformData!.platform.type;
  }

  get platformName(): string {
    return this.platformData?.platform.name ?? '';
  }

  get waypoints(): FormWaypoint[] {
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

  renderLocalWaypoints() {
    if (!this.localReportLayer || this.platformData === undefined) return;

    this.localReportSource.clear();

    const features = this.waypoints.map((waypoint) => {
      const feature = this.createWaypointFeature(
        formWaypointToWaypoint(waypoint),
        formPlatformToPlatform(this.platformData!.platform),
        this.name,
        this.color,
      );

      feature.set('draggable', true);
      return feature;
    });

    this.localReportSource.addFeatures(features);
  }

  renderLocalVector() {
    if (!this.localVectorLayer || this.waypoints.length < 2) return;

    this.localVectorSource.clear();

    const feature = this.geoJson.readFeature(
      lineString(
        this.waypoints.map(
          (waypoint) => [waypoint.lon, waypoint.lat] as Coordinate,
        ),
      ),
    ) as Feature;
    feature.set('draggable', false);

    this.localVectorSource.addFeature(feature);
  }

  renderLocalEllipsis() {
    if (!this.localEllipsisLayer) return;

    this.localEllipsisSource.clear();

    const features = this.waypoints.flatMap((waypoint) => {
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

      const feature = this.geoJson.readFeature(circleType) as Feature<Geometry>;
      feature.setStyle(
        new Styled.Style({
          stroke: new Styled.Stroke({ color: '#c2e5e9ff', width: 1 }),
          image: new Styled.Circle({
            radius: 120,
            fill: new Styled.Fill({ color: '#c2e5e9ff' }),
          }),
        }),
      );

      feature.set('draggable', false);

      return feature;
    });

    this.localEllipsisSource.addFeatures(features);
  }

  onDrawEnd() {
    this.updateToggles(false, 'DRAW');
    this.updateMap();
  }

  onDrawNewWaypoint(points: Coordinate[]) {
    const waypoints = this.waypoints;
    const lastPoint: FormWaypoint | undefined =
      this.waypoints[waypoints.length - 1];

    const newCoordinates: FormWaypoint[] = points.map((point) => {
      return {
        id: createNewWaypointId(
          this.platformData?.platform.id ?? this.platformName ?? 'platform',
          this.waypoints?.map((waypoint) => {
            return formWaypointToWaypoint(waypoint);
          }) ?? [],
        ),
        lat: point[0],
        lon: point[1],
        z: 0,
        speedKts: lastPoint?.speedKts ?? 0,
        datetime: !lastPoint?.datetime
          ? createFormDateString(new Date())
          : new Date(lastPoint.datetime).getTime() <
              minusHours(new Date(this.maxDateTime), 1).getTime()
            ? createFormDateString(addHours(new Date(lastPoint.datetime), 1))
            : lastPoint.datetime,
        index: waypoints.length,
      } as FormWaypoint;
    });

    this.waypoints.push(...newCoordinates);
    this.renderLocalVector();
  }

  dragPointOnMap(coord: Coordinate, waypointId: string) {
    if (waypointId && waypointId !== '' && this.platformData) {
      const newCoordinates = this.waypoints.map((point) => {
        if (point.id === waypointId) {
          return {
            ...point,
            lat: toFixed(coord[1], 3),
            lon: toFixed(coord[0], 3),
          } as FormWaypoint;
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

      this.renderLocalVector();
    }
  }

  ngModelChange(event: any) {
    this.renderLocalWaypoints();
  }

  ////////////// NON-MAP METHODS \\\\\\\\\\\\\\\\

  addWaypoint() {
    this.validatedWaypointCreation = {};

    if (this.platformData?.platform) {
      const validatedResults = this.validateWaypoint({
        lat: this.latInput,
        lon: this.lonInput,
        datetime: this.datetimeInput,
        speedKts: this.speedInput,
        z: this.zInput,
      } as FormWaypoint);

      this.validatedWaypointCreation = validatedResults.validated ?? {};

      if (validatedResults.errorFields.length > 0) {
        this.toastSerivce.popErrorToast(
          'Add Waypoint Error',
          `Form field${validatedResults.errorFields.length > 0 ? 's' : ''} ${validatedResults.errorFields.join(', ')} was not filled out. Only a valid waypoint can be added to the existing table.`,
        );
      } else {
        const newWaypoint = {
          id: createNewWaypointId(
            this.platformData?.platform.id ?? this.platformName ?? 'platform',
            this.waypoints.map((waypoint) => formWaypointToWaypoint(waypoint)),
          ),
          lat: this.latInput!,
          lon: this.lonInput!,
          z: this.zInput!,
          speedKts: this.speedInput!,
          datetime: this.datetimeInput!,
          smaj: this.smajInput!,
          smin: this.sminInput!,
          orientation: this.orientationInput!,
        };

        this.platformData.platform.waypoints = this.platformData.platform
          .waypoints
          ? [
              ...this.platformData.platform.waypoints,
              {
                ...newWaypoint,
                index: this.platformData.platform.waypoints.length,
              },
            ]
          : [
              {
                ...newWaypoint,
                index: 0,
              },
            ];

        this.updateMap();
      }
    }
  }

  deleteWaypoint(index: number) {
    this.waypoints?.splice(index, 1);
    this.shiftWaypoints();
    this.updateMap();
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

  getWaypointInvalid(index: number, fieldName: string): boolean {
    const waypoint = this.validatedInput.waypoints?.[index];

    if (waypoint == undefined) return false;

    if (fieldName == 'lat') {
      return waypoint.lat !== undefined;
    }
    if (fieldName == 'lon') {
      return waypoint.lon !== undefined;
    }
    if (fieldName == 'datetime') {
      return waypoint.datetime !== undefined;
    }
    if (fieldName == 'speedKts') {
      return waypoint.speedKts !== undefined;
    }
    if (fieldName == 'z') {
      return waypoint.z !== undefined;
    }
    if (fieldName == 'smaj') {
      return waypoint.smaj !== undefined;
    }
    if (fieldName == 'smin') {
      return waypoint.smin !== undefined;
    }
    if (fieldName == 'orientation') {
      return waypoint.orientation !== undefined;
    }

    return false;
  }

  validate(): boolean {
    if (this.platformData === undefined) {
      return false;
    }

    const errorMessageAdditions: string[] = [];
    this.validatedInput = {};

    // ensure all fields are filled
    if (this.color == null) {
      errorMessageAdditions.push(
        `Platform color cannot be undefined. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        color: 'Invalid',
      };
    }
    if (this.name == null || this.name === '') {
      errorMessageAdditions.push(
        `Platform name cannot be undefined. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        name: 'Invalid',
      };
    }
    if (this.maxSpeed == null || Number.isNaN(this.maxSpeed)) {
      errorMessageAdditions.push(
        `Platform speed cannot be undefined. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        maxSpeed: 'Invalid',
      };
    }
    if (this.type === 'AIR' && (this.maxZ == null || Number.isNaN(this.maxZ))) {
      errorMessageAdditions.push(
        `Platform color cannot be undefined for an air platform. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        maxZ: 'Invalid',
      };
    }
    if (
      this.type !== 'GROUND' &&
      (this.maxZ == null || Number.isNaN(this.maxZ))
    ) {
      errorMessageAdditions.push(
        `Platform ${this.type == 'AIR' ? 'Alt' : 'Depth'} cannot be undefined for a ${this.type} platform. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        maxZ: 'Invalid',
      };
    }
    if (
      this.reportingFrequency == null ||
      Number.isNaN(this.reportingFrequency)
    ) {
      errorMessageAdditions.push(
        `Platform reporting frequency cannot be undefined. Please set to a valid value before proceeding.`,
      );
      this.validatedInput = {
        ...this.validatedInput,
        reportingFrequency: 'Invalid',
      };
    }

    const invalidWapoint = [];

    const earliestTime = new Date(this.minDateTime);
    const latestTime = new Date(this.maxDateTime);

    for (let i = 0; i < this.waypoints.length; i++) {
      const waypoint = this.waypoints[i];
      invalidWapoint.push(this.validateWaypoint(waypoint).validated);

      if (
        createISODateFromFormString(waypoint.datetime).getTime() <
        earliestTime.getTime()
      ) {
        errorMessageAdditions.push(
          `Waypoint ${waypoint.index} has a date that is earlier than the scenario start time.`,
        );
      }
      if (
        createISODateFromFormString(waypoint.datetime).getTime() >
        latestTime.getTime()
      ) {
        errorMessageAdditions.push(
          `Waypoint ${waypoint.index} has a date that is later than the scenario end time.`,
        );
      }

      if (i !== 0) {
        const previousWaypoint = this.waypoints[i - 1];

        if (
          createISODateFromFormString(waypoint.datetime).getTime() <
          createISODateFromFormString(previousWaypoint.datetime).getTime()
        ) {
          errorMessageAdditions.push(
            `Waypoint ${waypoint.index} is scheduled before Waypoint ${previousWaypoint.index} but comes after in order.`,
          );
        }
      }
    }

    if (invalidWapoint.find((message) => message !== undefined)) {
      this.validatedInput = {
        ...this.validatedInput,
        waypoints: invalidWapoint,
      };
    }

    if (errorMessageAdditions.length > 0) {
      this.errorMessage = errorMessageAdditions.join(', ');
      return false;
    }

    this.errorMessage = undefined;
    return true;
  }

  validateWaypoint(waypoint: FormWaypoint): {
    validated: ValidatedWaypoint | undefined;
    errorFields: string[];
  } {
    const errorFields: string[] = [];
    let validatedWaypoint: ValidatedWaypoint = {};

    if (waypoint.lat == null || isNaN(waypoint.lat)) {
      errorFields.push('Lat');
      validatedWaypoint = {
        ...validatedWaypoint,
        lat: 'Invalid',
      };
    }

    if (waypoint.lon == null || isNaN(waypoint.lon)) {
      errorFields.push('Lon');
      validatedWaypoint = {
        ...validatedWaypoint,
        lon: 'Invalid',
      };
    }

    if (waypoint.speedKts == null || isNaN(waypoint.speedKts)) {
      errorFields.push('Speed');
      validatedWaypoint = {
        ...validatedWaypoint,
        speedKts: 'Invalid',
      };
    }

    if (waypoint.smaj == null || isNaN(waypoint.smaj)) {
      errorFields.push('smaj');
      validatedWaypoint = {
        ...validatedWaypoint,
        smaj: 'Invalid',
      };
    }

    if (waypoint.smin == null || isNaN(waypoint.smin)) {
      errorFields.push('smin');
      validatedWaypoint = {
        ...validatedWaypoint,
        smin: 'Invalid',
      };
    }

    if (waypoint.orientation == null || isNaN(waypoint.orientation)) {
      errorFields.push('Orientation');
      validatedWaypoint = {
        ...validatedWaypoint,
        orientation: 'Invalid',
      };
    }

    if (waypoint.datetime == null) {
      errorFields.push('Date/Time');
      validatedWaypoint = {
        ...validatedWaypoint,
        datetime: 'Invalid',
      };
    } else if (
      new Date(createISODateFromFormString(waypoint.datetime)) <
        new Date(createISODateFromFormString(this.minDateTime)) ||
      new Date(createISODateFromFormString(waypoint.datetime)) >
        new Date(createISODateFromFormString(this.maxDateTime))
    ) {
      validatedWaypoint = {
        ...validatedWaypoint,
        datetime: 'Invalid',
      };
      this.toastSerivce.popErrorToast(
        'Add Waypoint Error',
        `Date/Time cannot be before min date time of ${this.minDateTime} or after ${this.maxDateTime}.` +
          `Please ensure it is within the required bounds, or change the overall min/max datetimes for the scenario first.`,
      );
    }

    if (waypoint.z == null || isNaN(waypoint.z)) {
      if (this.type === 'MARITIME') errorFields.push('Depth');
      validatedWaypoint = {
        ...validatedWaypoint,
        z: 'Invalid',
      };
      if (this.type === 'AIR') {
        errorFields.push('Alt');
        validatedWaypoint = {
          ...validatedWaypoint,
          z: 'Invalid',
        };
      }
    }

    return {
      validated: errorFields.length > 0 ? validatedWaypoint : undefined,
      errorFields: errorFields,
    };
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
    this.platformData = undefined;

    this.validatedInput = {};
    this.validatedWaypointCreation = {};
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
    this.localReportSource.dispose();
    this.localReportLayer.dispose();
  }
}
