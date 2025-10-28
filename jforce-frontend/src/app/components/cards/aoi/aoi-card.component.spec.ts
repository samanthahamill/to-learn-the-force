import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AoiCardComponent } from './aoi-card.component';

describe('AoiCardComponent', () => {
  let component: AoiCardComponent;
  let fixture: ComponentFixture<AoiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AoiCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AoiCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
