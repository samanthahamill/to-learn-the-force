import { Component } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Control } from 'ol/control.js';
import { ChangeAOIRequest } from '../../../services/user-state.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DrawCircleAoiControl } from './control/draw-circle-aoi-control.component';
import { BaseMapComponent } from './base-map.component';

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
  vectorSource: VectorSource;
  vectorLayer: VectorLayer;

  constructor() {
    super('mapContainer');
    this.drawCircleAoiControl = new DrawCircleAoiControl({
      onDrawEnd: (evt: any) => this.onDrawCircleAoiComplete(evt),
    });
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
    });
  }

  override customLayers() {
    return [this.vectorLayer];
  }

  override addButtonsToBar(): Control[] {
    return [this.drawCircleAoiControl];
  }

  private onDrawCircleAoiComplete(evt: ChangeAOIRequest) {
    this.userStateService.updateAOIRequest(evt);
  }

  override destroyMap() {
    super.destroyMap();
    this.vectorSource.dispose();
    this.vectorLayer.dispose();
  }
}
