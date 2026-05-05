import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';
import { ApplicationService } from '../service/application.service';
import { JobApplication, ApplicationSearchParams, ApplicationUpdateRequest } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationFacade {
  private readonly service = inject(ApplicationService);

  readonly applications = signal<JobApplication[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly stats = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      interview: apps.filter(a => a.offerStatus === 'INTERVIEW_INVITATION').length,
      viewed: apps.filter(a => a.offerStatus === 'APPLICATION_VIEWED').length,
      rejected: apps.filter(a => a.offerStatus === 'REJECTED').length,
      active: apps.filter(a => a.offerStatus === 'WAITING_RESPONSE').length,
    };
  });

  search(params: ApplicationSearchParams): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.search(params).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: apps => this.applications.set(apps),
      error: (err: { message?: string }) => this.error.set(err?.message ?? 'Failed to load applications'),
    });
  }

  update(id: number, payload: ApplicationUpdateRequest): void {
    this.service.update(id, payload).subscribe({
      next: updated => this.applications.update(apps => apps.map(a => a.id === id ? updated : a)),
      error: (err: { message?: string }) => this.error.set(err?.message ?? 'Failed to update application'),
    });
  }

  delete(id: number): void {
    this.service.delete(id).subscribe({
      next: () => this.applications.update(apps => apps.filter(a => a.id !== id)),
      error: (err: { message?: string }) => this.error.set(err?.message ?? 'Failed to delete application'),
    });
  }
}
