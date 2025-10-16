import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { CardComponent } from '../card.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-card',
  imports: [CommonModule, CardComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './platform.component.html',
  styleUrl: './platform.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlatformComponent {
  @Input() platform!: FormGroup;
}
