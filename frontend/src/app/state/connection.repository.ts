import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * This repository is where all data should be updated via CRUD commands. Business logic should
 * be applied in services
 */
@Injectable({
  providedIn: 'root',
})
export class ConnectionRepository {
  private http = inject(HttpClient);

  checkConnection(): Observable<boolean> {
    return this.http.get<boolean>(`/checkConnection`);
  }
}
