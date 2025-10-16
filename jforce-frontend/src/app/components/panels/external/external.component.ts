import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-external-card',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './external.component.html',
  styleUrl: './external.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExternalComponent {
  @Input() formGroup!: FormGroup;
  importIcon = faUpload; // TODO change this icon to be something idfferent
}
