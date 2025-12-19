import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * This repository is where all data should be updated via CRUD commands. Business logic should
 * be applied in services
 */
@Injectable({
  providedIn: 'root',
})
export class ConversionRepository {
  private http = inject(HttpClient);

  postConvertFile(file: File, timeOffsetMillis: number): Observable<string> {
    return this.http.post(
      `/convert`,
      { file, timeOffsetMillis },
      {
        responseType: 'text', // Crucial for receiving non-JSON data as text
        headers: new HttpHeaders({
          Accept: 'text/csv',
        }),
      },
    );
  }
}
