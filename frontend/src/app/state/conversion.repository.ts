import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async postConvertFile(file: File): Promise<Observable<string>> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.blobToBase64(file).then((byteArray) => {
      // Remove the "data:mime/type;base64," prefix
      const payload = byteArray.split(',')[1];
      return this.http.post(
        `/convert`,
        { data: payload },
        {
          responseType: 'text', // Crucial for receiving non-JSON data as text
        },
      );
    });
  }

  putNewStartDate(newStartDate: string): Observable<void> {
    return this.http.put<void>(`/newStartDate`, newStartDate);
  }
}
