import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformCardComponent } from './platform-card.component';

describe('PlatformCardComponent', () => {
  let component: PlatformCardComponent;
  let fixture: ComponentFixture<PlatformCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
