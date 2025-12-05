import { Component, inject } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Control } from 'ol/control.js';
import {
  ChangeAOIRequest,
  UserStateService,
} from '../../../services/user-state.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DrawCircleAoiControl } from './control/draw-circle-aoi-control.component';
import { BaseMapComponent } from '../../general/base-map.component';
import { MapContextMenu } from './menu/map-context-menu.component';
import { MapBrowserEvent } from 'ol';
import { getPlatformIdFromWaypointId } from '../../../shared/utils';
import { ToastService } from '../../../services/toast.service';
import { DialogEditorService } from '../../../services/dialog-editor.service';

export type FeatureId = string | number;

@UntilDestroy()
@Component({
  selector: 'app-map',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent extends BaseMapComponent {
  private drawCircleAoiControl: DrawCircleAoiControl;
  private mapContextMenu: MapContextMenu;
  vectorSource: VectorSource;
  vectorLayer: VectorLayer;

  private toastService = inject(ToastService);
  private dialogEditorService = inject(DialogEditorService);

  constructor() {
    super('mapContainer', 'mapMousePositionDisplay');
    this.drawCircleAoiControl = new DrawCircleAoiControl({
      onDrawEnd: (evt: any) => this.onDrawCircleAoiComplete(evt),
    });

    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });

    this.mapContextMenu = new MapContextMenu({
      toggleTrackLabels: () => this.toggleTrackLabels(),
      document: document,
    });
  }

  ////////////// OVERRIDEN METHODS \\\\\\\\\\\\\\\\

  override ngOnInit() {
    super.ngOnInit();
    // right click menu changes if user clicks on map vs a feature
    this.map?.getTargetElement().addEventListener('contextmenu', (event) => {
      event.preventDefault();

      this.mapContextMenu.createContextMenu(
        document,
        event.clientX,
        event.clientY,
      );
    });

    this.map?.on(
      'dblclick',
      (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
        event.preventDefault();
        const feature =
          this.map!.forEachFeatureAtPixel(event.pixel, (feature) => feature) ||
          undefined;

        if (feature !== undefined && feature.getId() !== undefined) {
          const platforms = this.userStateService.platforms;

          const platformId = getPlatformIdFromWaypointId(
            feature.getId() as string,
          );

          const platformIndex = platforms.findIndex(
            (platform) => platform.id == platformId,
          );

          if (platformIndex !== undefined) {
            this.dialogEditorService.updatePlatformAndOpenDialog(platformIndex);
          } else {
            this.toastService.showErrorMessage(
              'Cannot Edit Platform',
              `The selected waypoint could not be associated with a valid platform`,
            );
            console.log(
              `Platform id: ${platformId}; Platform index: ${platformIndex}; Feature id: ${feature.getId()}`,
            );
          }
        }
      },
    );
  }

  override customLayers() {
    return [this.vectorLayer];
  }

  override addButtonsToBar(): Control[] {
    return [this.drawCircleAoiControl];
  }

  ////////////// CUSTOM METHODS \\\\\\\\\\\\\\\\

  private onDrawCircleAoiComplete(evt: ChangeAOIRequest) {
    this.userStateService.updateAOIRequest(evt);
  }

  override destroyMap() {
    super.destroyMap();
    this.vectorSource.dispose();
    this.vectorLayer.dispose();
  }
}
