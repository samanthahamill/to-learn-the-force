import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../card.component';
import { UserStateService } from '../../../services/user-state.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-aoi-card',
  imports: [CardComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './aoi-card.component.html',
  styleUrl: './aoi-card.component.scss',
})
export class AoiCardComponent implements OnInit, AfterViewInit {
  @Input() aoiFormGroup!: FormGroup;
  @Input() onInputUpdated!: (details: string) => void;
  @Input() formUpdated!: () => void;
  private userState = inject(UserStateService);

  constructor() {}
  ngOnInit(): void {
    this.aoiFormGroup?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.formUpdated();
    });
  }

  ngAfterViewInit(): void {
    if (this.aoiFormGroup === undefined) {
      console.error('AOI Form was undefined. Make sure this is initialized');
      return;
    }

    const lat: number | undefined = this.aoiFormGroup.controls['lat']?.value;
    const lon: number | undefined = this.aoiFormGroup.controls['lon']?.value;
    const alt: number | undefined = this.aoiFormGroup.controls['alt']?.value;
    const radius: number | undefined =
      this.aoiFormGroup.controls['radius']?.value;
    const aoi = this.userState.getAOI;

    if (
      lat &&
      lon &&
      alt &&
      radius &&
      (aoi == undefined ||
        aoi.lat != lat ||
        aoi.lon != lon ||
        aoi.alt != alt ||
        aoi.radius != radius)
    ) {
      this.updateDataSourceService();
    }
  }

  createToast(message: string): void {
    this.onInputUpdated(message);
    this.updateDataSourceService();
  }

  updateDataSourceService(): void {
    const lat = this.aoiFormGroup.controls['lat'].value as number;
    const lon = this.aoiFormGroup.controls['lon'].value as number;
    const alt = this.aoiFormGroup.controls['elevation'].value as number;
    const radius = this.aoiFormGroup.controls['radius'].value as number;
    this.userState.updateAOI({
      lat: lat,
      lon: lon,
      alt: alt,
      radius: radius,
    });
  }
}
