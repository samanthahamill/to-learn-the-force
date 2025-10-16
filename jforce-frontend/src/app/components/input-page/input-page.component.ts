import { Component, inject, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserStateService } from '../../services/user-state.service';

@UntilDestroy()
@Component({
  selector: 'app-input-page',
  imports: [],
  templateUrl: './input-page.component.html',
  styleUrl: './input-page.component.scss',
})
export class InputPageComponent implements OnInit {
  formGroup: FormGroup | undefined;

  private userStateService = inject(UserStateService);

  constructor(private fb: FormBuilder) {
    this.userStateService.input$
      .pipe(untilDestroyed(this))
      .subscribe((data) => {
        if (data !== undefined) {
          this.updateInput(data);
        }
      });
  }

  ngOnInit(): void {}

  updateInput(input: any) {
    if (input !== null) {
      this.formGroup = this.fb.group({
        platform: this.fb.group({
          isPlaform: [input.platform ?? ''],
        }),
        tools: this.fb.group({
          isTool: [input.tool ?? ''],
        }),
      });
    }
  }
}
