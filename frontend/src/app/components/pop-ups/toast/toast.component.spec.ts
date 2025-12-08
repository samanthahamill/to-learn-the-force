import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ToastComponent } from "./toast.component";
import { ToastService } from "../../services/toast.service";
import { MessageService } from "primeng/api";

describe("ToastComponent", () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastService;
  let messageService: MessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService, MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);

    messageService = fixture.debugElement.injector.get(MessageService);
    service = fixture.debugElement.injector.get(ToastService);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be created when service is notified", () => {
    const mySpy = jest.spyOn(messageService, "add");
    const mockMessage = "Mock Message Sent";

    service.showSuccessMessage(mockMessage);

    expect(mySpy).toHaveBeenCalled();
    expect(mySpy).toHaveBeenCalledWith({
      closable: true,
      detail: undefined,
      life: 10000,
      severity: "success",
      sticky: false,
      summary: "Mock Message Sent",
    });
  });
});
