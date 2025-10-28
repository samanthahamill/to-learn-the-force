import {
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  WaypointEditorInformation,
  WaypointEditorService,
} from '../../../services/waypoint-editor.service';

declare var $: any;

@UntilDestroy()
@Component({
  selector: 'app-waypoint-dialog',
  imports: [],
  templateUrl: './waypoint-dialog.component.html',
  styleUrl: './waypoint-dialog.component.scss',
})
export class WaypointDialogComponent implements OnInit {
  waypointFormData: WaypointEditorInformation | undefined;
  @ViewChild('waypointModal') modal!: ElementRef;
  @Input() platformName!: string;

  waypointEditor = inject(WaypointEditorService);

  constructor() {}

  ngOnInit() {
    this.waypointEditor.waypointInformation$
      .pipe(untilDestroyed(this))
      .subscribe((info) => {
        console.log('WaypointDialogComponent');
        this.waypointFormData = info;
        this.openModal();
      });
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
}
