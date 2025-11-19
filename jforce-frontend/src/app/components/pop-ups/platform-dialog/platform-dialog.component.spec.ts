import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformDialogComponent } from './platform-dialog.component';

describe('PlatformDialogComponent', () => {
  let component: PlatformDialogComponent;
  let fixture: ComponentFixture<PlatformDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
