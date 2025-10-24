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
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faRemove } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-platform-card',
  imports: [CommonModule, CardComponent, FormsModule, ReactiveFormsModule],
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

  ngOnInit(): void {
    this.name = this.platformForm.get('name')?.value ?? 'Platform';
  }
}
