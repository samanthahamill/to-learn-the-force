import {
  Component,
  ElementRef,
  inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  WaypointEditorInformation,
  WaypointEditorService,
} from '../../../services/waypoint-editor.service';
import { UserStateService } from '../../../services/user-state.service';
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
import { point } from '@turf/turf';
import CircleStyle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';

declare var $: any;
const projection = 'EPSG:4326';

@UntilDestroy()
@Component({
  selector: 'app-waypoint-dialog',
  imports: [
    CommonModule,
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './waypoint-dialog.component.html',
  styleUrl: './waypoint-dialog.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class WaypointDialogComponent implements OnInit {
  removeIcon = faRemove;
  copyIcon = faCopy;
  addIcon = faAdd;

  waypointFormData: WaypointEditorInformation | undefined;
  @ViewChild('waypointModal') modal!: ElementRef;

  map: Map | undefined;
  olMapView: View;
  aoiValue: AOIType | undefined;

  reportSource: VectorSource = new VectorSource();
  reportLayer: VectorLayer;

  private aoiLayer: VectorLayer<any>;
  private drawingSource = new VectorSource();
  private drawingLayer!: VectorLayer<VectorSource>;
  private draw!: Draw;
  private snap!: Snap;
  private drawToggleSelection: Toggle | undefined;

  private geoJSON = new GeoJSON();

  allowDraw: boolean;

  waypointEditor = inject(WaypointEditorService);
  userState = inject(UserStateService);

  latInput: number | undefined = undefined;
  lonInput: number | undefined = undefined;
  altInput: number | undefined = undefined;
  datetimeInput: string | undefined = undefined;
  speedInput: number | undefined = undefined;

  constructor() {
    this.drawingLayer = new VectorLayer({
      source: this.drawingSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        stroke: new Styled.Stroke({ color: 'rgb(255, 0, 235' }),
      }),
    });

    this.aoiLayer = new VectorLayer({ source: new VectorSource() });

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
    this.renderWaypoints();
  }

  get platformName() {
    return this.waypointFormData?.platformName;
  }

  get waypoints(): Waypoint[] {
    return this.waypointFormData?.waypoints ?? [];
  }

  ngOnInit() {
    this.waypointEditor.waypointInformation$
      .pipe(untilDestroyed(this))
      .subscribe((info) => {
        if (info !== undefined) {
          this.waypointFormData = { ...info };
          this.openModal();
        }
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
      target: 'mapContainerWaypoints',
      controls: defaultControls().extend([
        new ScaleLine({ units: 'nautical' }),
        new MousePosition({
          coordinateFormat: createStringYX(4),
          projection: projection,
          className: 'custom-mouse-position',
          target: 'mousePositionDisplay',
        }),
      ]),
      layers: [this.drawingLayer, this.aoiLayer, this.reportLayer, tile],
      view: this.olMapView,
    });

    const modify = new Modify({ source: this.drawingSource });
    this.map.addInteraction(modify);

    // TODO this doesn't work
    this.draw = new Draw({
      source: this.drawingSource,
      type: 'Point',
    });
    this.snap = new Snap({ source: this.drawingSource });

    this.initButtonBar();
  }

  groupObject = faObjectGroup;

  initButtonBar() {
    const btnBar = new Bar();
    btnBar.setPosition('left');

    this.drawToggleSelection = new Toggle({
      className: 'ol-selection-bar-toggle',
      html: `<fa-icon [icon]="groupObject"/>`, // todo this doesn't show up
      title: 'Draw Selection',
      active: this.allowDraw,
      // bar: this.selectionBar,
      onToggle: (active) => (this.allowDraw = active),
    });
    btnBar.addControl(this.drawToggleSelection);

    // TODO add back in
    this.map?.addControl(btnBar);
  }

  handleDrawingActivated(active: boolean) {
    this.allowDraw = active;
    // change below
    if (active) {
      this.activeDrawPointInteraction();
    } else {
      this.stopDrawPointInteraction();
    }
  }

  activeDrawPointInteraction() {
    // this.drawToggleSelection?.activate();
    this.map?.addInteraction(this.draw);
    this.map?.addInteraction(this.snap);
  }

  stopDrawPointInteraction() {
    this.map?.removeInteraction(this.draw);
    this.map?.removeInteraction(this.snap);
  }

  renderWaypoints() {
    if (!this.reportLayer) return;

    const features: any[] = [];
    this.waypoints.forEach((waypoint) => {
      const feature = this.createWaypointFeature(waypoint);
      features.push(feature);
    });

    this.reportSource.addFeatures(features);
  }

  createWaypointFeature(waypoint: Waypoint) {
    const pt = point(
      [waypoint.lon, waypoint.lat],
      { data: waypoint },
      { id: waypoint.index },
    );

    const feature = this.geoJSON.readFeature(pt) as Feature<Geometry>;
    const ptStyle = this.getStyle();
    feature.setStyle(ptStyle);

    const label = `Waypoint ${waypoint.index}\nloc: [${(waypoint.lon, waypoint.lat)}];\nalt: ${waypoint.alt}\nspeed:${waypoint.speedKts}`;
    ptStyle.getText()?.setText(label);
    return feature;
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

  addWaypoint() {
    if (
      this.waypointFormData &&
      this.latInput &&
      this.lonInput &&
      this.speedInput &&
      this.altInput &&
      this.datetimeInput
    ) {
      if (this.waypoints === undefined) {
        this.waypointFormData.waypoints = [
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

  openModal() {
    if (this.waypointFormData) {
      $(this.modal.nativeElement).modal('show');
    } else {
      console.error(
        'Could not show waypoint for some reason form data is null',
      );
    }
  }

  closeModal() {
    $(this.modal.nativeElement).modal('hide');
  }

  closeAndSaveModal() {
    this.closeModal();
    if (this.waypointFormData) {
      this.userState.updateWaypoint(
        this.waypointFormData.platformIndex,
        this.waypoints,
      );
    }
  }
}
