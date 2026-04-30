import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApplicationFacade } from '../../facade/application.facade';
import { JobApplication, ApplicationSearchParams, ApplicationUpdateRequest, OfferStatus } from '../../models/application.model';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class ApplicationsComponent implements OnInit {
  protected readonly facade = inject(ApplicationFacade);

  protected searchForm = {
    appliedAfter: '',
    companyName: '',
    offerStatus: '',
    resumeVersion: '',
    platform: '',
  };

  protected showSearch = signal(false);
  protected activeFilter = signal<OfferStatus | 'ALL'>('ALL');
  protected editingApp = signal<JobApplication | null>(null);
  protected editForm: ApplicationUpdateRequest = {};

  protected readonly offerStatusOptions: { value: OfferStatus; label: string }[] = [
    { value: 'SENT', label: 'Applied' },
    { value: 'VIEWED', label: 'Viewed' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ACTIVE', label: 'Pending' },
    { value: 'INTERVIEW_INVITATION', label: 'Interview' },
  ];

  protected readonly visibleApps = computed(() => {
    const f = this.activeFilter();
    const apps = this.facade.applications();
    return f === 'ALL' ? apps : apps.filter(a => a.offerStatus === f);
  });

  ngOnInit(): void {
    this.facade.search({});
  }

  protected onSearch(): void {
    const params: ApplicationSearchParams = {};
    if (this.searchForm.appliedAfter) params.appliedAfter = this.searchForm.appliedAfter;
    if (this.searchForm.companyName) params.companyName = this.searchForm.companyName;
    if (this.searchForm.offerStatus) params.offerStatus = this.searchForm.offerStatus as OfferStatus;
    if (this.searchForm.resumeVersion) params.resumeVersion = this.searchForm.resumeVersion;
    if (this.searchForm.platform) params.platform = this.searchForm.platform;
    this.facade.search(params);
    this.activeFilter.set('ALL');
  }

  protected onReset(): void {
    this.searchForm = { appliedAfter: '', companyName: '', offerStatus: '', resumeVersion: '', platform: '' };
    this.facade.search({});
    this.activeFilter.set('ALL');
  }

  protected openEdit(app: JobApplication): void {
    this.editingApp.set(app);
    this.editForm = {
      companyName: app.companyName,
      jobTitle: app.jobTitle,
      platform: app.platform,
      appliedDate: app.appliedDate ? app.appliedDate.substring(0, 10) : undefined,
      offerStatus: app.offerStatus,
      mark: app.mark,
      jd: app.jd,
      resumeVersion: app.resumeVersion,
      emailSubject: app.emailSubject,
      emailFrom: app.emailFrom,
      snippet: app.snippet,
    };
  }

  protected closeEdit(): void {
    this.editingApp.set(null);
    this.editForm = {};
  }

  protected onDelete(): void {
    const app = this.editingApp();
    if (!app) return;
    if (!confirm(`Delete application for ${app.companyName}?`)) return;
    this.facade.delete(app.id);
    this.closeEdit();
  }

  protected submitEdit(): void {
    const app = this.editingApp();
    if (!app) return;
    const f = this.editForm;
    const payload: ApplicationUpdateRequest = {};
    if (f.companyName) payload.companyName = f.companyName;
    if (f.jobTitle) payload.jobTitle = f.jobTitle;
    if (f.platform) payload.platform = f.platform;
    if (f.appliedDate) payload.appliedDate = f.appliedDate;
    if (f.offerStatus) payload.offerStatus = f.offerStatus;
    if (f.mark != null) payload.mark = f.mark;
    if (f.jd) payload.jd = f.jd;
    if (f.resumeVersion) payload.resumeVersion = f.resumeVersion;
    if (f.emailSubject) payload.emailSubject = f.emailSubject;
    if (f.emailFrom) payload.emailFrom = f.emailFrom;
    if (f.snippet) payload.snippet = f.snippet;
    this.facade.update(app.id, payload);
    this.closeEdit();
  }

  protected statusLabel(status: OfferStatus): string {
    const map: Record<OfferStatus, string> = {
      SENT: 'Applied',
      VIEWED: 'Viewed',
      REJECTED: 'Rejected',
      ACTIVE: 'Pending',
      INTERVIEW_INVITATION: 'Interview',
    };
    return map[status];
  }

  protected statusClass(status: OfferStatus): string {
    const map: Record<OfferStatus, string> = {
      SENT: 'sent',
      VIEWED: 'viewed',
      REJECTED: 'rejected',
      ACTIVE: 'active',
      INTERVIEW_INVITATION: 'interview',
    };
    return map[status];
  }

  protected formatDate(date: string | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  }

  protected markStars(mark: number | undefined): string {
    if (!mark) return '';
    return '★'.repeat(mark) + '☆'.repeat(5 - mark);
  }
}
