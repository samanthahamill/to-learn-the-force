import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioInputCardComponent } from './scenario-input-card.component';

describe('ScenarioInputCardComponent', () => {
  let component: ScenarioInputCardComponent;
  let fixture: ComponentFixture<ScenarioInputCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioInputCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioInputCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
