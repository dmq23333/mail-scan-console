import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApplicationApiService } from '../api/application-api.service';
import { JobApplication, ApplicationSearchParams, ApplicationUpdateRequest } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly api = inject(ApplicationApiService);

  search(params: ApplicationSearchParams): Observable<JobApplication[]> {
    return this.api.search(params);
  }

  update(id: number, payload: ApplicationUpdateRequest): Observable<JobApplication> {
    return this.api.update(id, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
