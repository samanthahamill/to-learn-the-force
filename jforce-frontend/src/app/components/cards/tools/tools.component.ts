import { CommonModule } from '@angular/common';
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CardComponent } from '../card.component';

@Component({
  selector: 'app-tools-card',
  imports: [CommonModule, CardComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
})
export class ToolsComponent {
  @Input() tools!: FormGroup;
}
