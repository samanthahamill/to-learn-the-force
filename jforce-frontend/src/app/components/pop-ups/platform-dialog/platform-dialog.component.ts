import { Component, inject, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  PlatformEditorInformation,
  PlatformEditorService,
} from '../../../services/platform-editor.service';
import { UserStateService } from '../../../services/user-state.service';
import { deepClone } from '../../../shared/utils';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { WaypointEditorComponent } from '../../cards/waypoint-editor/waypoint-editor.component';
import { WaypointEditorInformation } from '../../../services/waypoint-editor.service';
import {
  Platform,
  PLATFORM_TYPE,
  PLATFORM_TYPE_OPTIONS,
} from '../../../shared/types';

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
    WaypointEditorComponent,
  ],
  templateUrl: './platform-dialog.component.html',
  styleUrl: './platform-dialog.component.scss',
})
export class PlatformDialogComponent implements OnInit {
  platformData: PlatformEditorInformation | undefined;
  platformEditorService = inject(PlatformEditorService);
  userState = inject(UserStateService);
  theresAnError: boolean = false;
  errorMessage: string | undefined;

  type: PLATFORM_TYPE;
  maxSpeed: number;
  maxDepth: number;
  maxAlt: number;
  friendly: boolean;
  color: string;

  reportingFrequency: number;
  name: string;

  platformTypeOptions = PLATFORM_TYPE_OPTIONS;

  constructor() {
    this.name = this.platformData?.platform.name ?? '';
    this.maxSpeed = this.platformData?.platform.maxSpeed ?? 0;
    this.maxDepth = this.platformData?.platform.maxDepth ?? 0;
    this.maxAlt = this.platformData?.platform.maxAlt ?? 0;
    this.friendly = this.platformData?.platform.friendly ?? true;
    this.color = this.platformData?.platform.color ?? '';
    this.type = this.platformData?.platform.type ?? 'AIR';
    this.reportingFrequency =
      this.platformData?.platform.reportingFrequency ?? 0;
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

  get waypointPlatformData(): WaypointEditorInformation {
    return {
      waypoints: this.platformData?.platform?.waypoints ?? [],
      platform: this.platformData?.platform ?? ({} as Platform),
      platformIndex: this.platformData?.platformIndex ?? 0,
    };
  }

  waypointPlatformDataUpdated(waypointPlatformData: WaypointEditorInformation) {
    this.platformData = {
      ...this.platformData!,
      platform: {
        ...this.platformData!.platform,
        waypoints: waypointPlatformData.waypoints,
      },
    };
  }

  ngOnInit() {
    this.platformEditorService.platformInformation$
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

          this.openModal();
        }
      });
  }

  openModal() {
    $('#platformModal').modal('show');
  }

  closeModal() {
    $('#platformModal').modal('hide');
  }

  closeAndSaveModal() {
    this.closeModal();
  }
}
