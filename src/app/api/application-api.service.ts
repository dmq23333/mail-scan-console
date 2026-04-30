import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobApplication, ApplicationSearchParams, ApplicationUpdateRequest } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/applications';

  search(params: ApplicationSearchParams): Observable<JobApplication[]> {
    let httpParams = new HttpParams();
    if (params.appliedAfter) httpParams = httpParams.set('appliedAfter', params.appliedAfter);
    if (params.companyName) httpParams = httpParams.set('companyName', params.companyName);
    if (params.offerStatus) httpParams = httpParams.set('offerStatus', params.offerStatus);
    if (params.resumeVersion) httpParams = httpParams.set('resumeVersion', params.resumeVersion);
    if (params.platform) httpParams = httpParams.set('platform', params.platform);
    return this.http.get<JobApplication[]>(this.baseUrl, { params: httpParams });
  }

  update(id: number, payload: ApplicationUpdateRequest): Observable<JobApplication> {
    return this.http.put<JobApplication>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
