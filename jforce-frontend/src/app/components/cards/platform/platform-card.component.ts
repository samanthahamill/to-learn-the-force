import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
  Output,
} from '@angular/core';
import { CardComponent, ICON_FUNCTION } from '../card.component';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgFor } from '@angular/common';
import { faRemove } from '@fortawesome/free-solid-svg-icons';
import { PLATFORM_TYPE, Waypoints } from '../../../shared/types';

@Component({
  selector: 'app-platform-card',
  imports: [
    CommonModule,
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    CommonModule,
  ],
  templateUrl: './platform-card.component.html',
  styleUrl: './platform-card.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlatformCardComponent implements OnInit {
  @Input() platformForm!: FormGroup;
  @Input() index!: number;
  @Output() onDeleteClicked = new EventEmitter<void>();
  name: string = '';
  removeIcon = faRemove;
  icons: Array<ICON_FUNCTION>;
  readonly: boolean = false;

  platformTypeOptions: Array<PLATFORM_TYPE> = ['AIR', 'GROUND', 'MARITIME'];

  constructor() {
    this.icons = [
      {
        icon: faRemove,
        type: 'DELETE',
        tooltip: 'Delete Platform',
        onClick: () => this.onDeleteClicked.emit(),
      },
    ];
  }

  get waypoints(): Waypoints[] {
    return (
      ((this.platformForm.get('waypoints') as FormArray)
        ?.value as Waypoints[]) ?? []
    );
  }

  ngOnInit(): void {
    this.name = this.platformForm.get('name')?.value ?? 'Platform';
    const readonly = this.platformForm.get('readonly')?.value;
    if (readonly !== undefined) {
      this.readonly = readonly;
    }
  }
}
