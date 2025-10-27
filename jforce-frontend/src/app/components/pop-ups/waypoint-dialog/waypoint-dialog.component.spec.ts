import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointDialogComponent } from './waypoint-dialog.component';

describe('WaypointDialogComponent', () => {
  let component: WaypointDialogComponent;
  let fixture: ComponentFixture<WaypointDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaypointDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaypointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
