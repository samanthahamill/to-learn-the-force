import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenarioInputPanelComponent } from './scenario-input-panel.component';

describe('ScenarioInputPanelComponent', () => {
  let component: ScenarioInputPanelComponent;
  let fixture: ComponentFixture<ScenarioInputPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioInputPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioInputPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
