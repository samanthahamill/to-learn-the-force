import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ClassificationBannerComponent } from "./classification-banner.component";

describe("ClassificationBannerComponent", () => {
  let component: ClassificationBannerComponent;
  let fixture: ComponentFixture<ClassificationBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassificationBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassificationBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
