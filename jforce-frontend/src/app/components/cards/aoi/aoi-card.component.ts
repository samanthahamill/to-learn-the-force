import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../card.component';

@Component({
  selector: 'app-aoi-card',
  imports: [CardComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './aoi-card.component.html',
  styleUrl: './aoi-card.component.scss',
})
export class AoiCardComponent {
  @Input() aoi!: FormGroup;
}
