import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from '../../../app.component';
import { CardComponent } from '../card.component';

@Component({
  selector: 'app-info-card',
  imports: [
    FormsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
  ],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss',
})
export class InfoCardComponent {
  @Input() info!: FormGroup;
}
