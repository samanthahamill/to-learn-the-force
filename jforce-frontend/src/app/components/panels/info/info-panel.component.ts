import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../../cards/card.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-info-panel',
  imports: [
    FormsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardComponent,
  ],
  templateUrl: './info-panel.component.html',
  styleUrl: './info-panel.component.scss',
})
export class InfoPanelComponent implements AfterViewInit {
  @Input() info!: FormGroup;
  @Input() formUpdated!: () => void;

  ngAfterViewInit(): void {
    this.info?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.formUpdated();
    });
  }
}
