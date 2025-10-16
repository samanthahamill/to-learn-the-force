import { Injectable } from "@angular/core";
import { ToastMessageOptions } from "primeng/api";
import { Subject } from "rxjs";

type NotificationLevel = "success" | "error" | "info";

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private toastSubject = new Subject<ToastMessageOptions | null>();
  toastState = this.toastSubject.asObservable();

  popToast(level: NotificationLevel, msg: string, details?: string) {
    this.showMessage(level, msg, details);
  }

  /**
   * A sticky success toast
   */
  popSuccessToast(msg: string, details?: string) {
    this.popToast("success", msg, details);
  }

  /**
   * A sticky info toast
   */
  popInfoToast(msg: string, details?: string) {
    this.popToast("info", msg, details);
  }

  /**
   * A sticky error toast
   */
  popErrorToast(msg: string, details?: string) {
    this.popToast("error", msg, details);
  }

  showInfoMessage(msg: string, details?: string) {
    this.showMessage("info", msg, details, 10000);
  }

  showErrorMessage(msg: string, details?: string) {
    this.showMessage("error", msg, details, 10000);
  }

  showSuccessMessage(msg: string, details?: string) {
    this.showMessage("success", msg, details, 10000);
  }

  showMessage(level: NotificationLevel, msg: string, details?: string, timeout?: number) {
    const sticky = timeout == undefined;

    this.toastSubject.next({ summary: msg, detail: details, severity: level, sticky: sticky, closable: true, life: timeout });
  }

  clear() {
    this.toastSubject.next(null);
  }
}
