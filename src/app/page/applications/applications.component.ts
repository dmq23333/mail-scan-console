import { AfterViewInit, Component, ElementRef, HostListener, inject, OnDestroy, OnInit, signal, computed, ViewChild } from '@angular/core';
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
export class ApplicationsComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly facade = inject(ApplicationFacade);
  @ViewChild('tableWrap') private tableWrapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('bottomScroller') private bottomScrollerRef?: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;
  private syncingFromTable = false;
  private syncingFromBottom = false;
  private readonly bottomScrollerBreakpoint = 992;

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
  protected readonly showBottomScroller = signal(false);
  protected readonly tableScrollWidth = signal(0);

  protected readonly offerStatusOptions: { value: OfferStatus; label: string }[] = [
    { value: 'APPLIED', label: 'Applied' },
    { value: 'APPLICATION_VIEWED', label: 'Viewed' },
    { value: 'WAITING_RESPONSE', label: 'Waiting' },
    { value: 'INTERVIEW_INVITATION', label: 'Interview' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  protected readonly visibleApps = computed(() => {
    const f = this.activeFilter();
    const apps = this.facade.applications();
    return f === 'ALL' ? apps : apps.filter(a => a.offerStatus === f);
  });

  ngOnInit(): void {
    this.facade.search({});
  }

  ngAfterViewInit(): void {
    this.updateBottomScroller();

    const tableWrap = this.tableWrapRef?.nativeElement;
    if (!tableWrap || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.updateBottomScroller());
    this.resizeObserver.observe(tableWrap);

    const table = tableWrap.querySelector('table');
    if (table) {
      this.resizeObserver.observe(table);
    }

    setTimeout(() => this.updateBottomScroller());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateBottomScroller();
  }

  protected onTableWrapScroll(): void {
    if (this.syncingFromBottom || !this.showBottomScroller()) {
      return;
    }

    const tableWrap = this.tableWrapRef?.nativeElement;
    const bottomScroller = this.bottomScrollerRef?.nativeElement;
    if (!tableWrap || !bottomScroller) {
      return;
    }

    this.syncingFromTable = true;
    bottomScroller.scrollLeft = tableWrap.scrollLeft;
    this.syncingFromTable = false;
  }

  protected onBottomScrollerScroll(): void {
    if (this.syncingFromTable || !this.showBottomScroller()) {
      return;
    }

    const tableWrap = this.tableWrapRef?.nativeElement;
    const bottomScroller = this.bottomScrollerRef?.nativeElement;
    if (!tableWrap || !bottomScroller) {
      return;
    }

    this.syncingFromBottom = true;
    tableWrap.scrollLeft = bottomScroller.scrollLeft;
    this.syncingFromBottom = false;
  }

  private updateBottomScroller(): void {
    const tableWrap = this.tableWrapRef?.nativeElement;
    if (!tableWrap) {
      return;
    }

    const scrollWidth = tableWrap.scrollWidth;
    const clientWidth = tableWrap.clientWidth;
    this.tableScrollWidth.set(scrollWidth);

    const needsHorizontalScroll = scrollWidth - clientWidth > 1;
    const showInCurrentViewport =
      window.innerWidth > 768 && window.innerWidth <= this.bottomScrollerBreakpoint;
    this.showBottomScroller.set(needsHorizontalScroll && showInCurrentViewport);

    const bottomScroller = this.bottomScrollerRef?.nativeElement;
    if (this.showBottomScroller() && bottomScroller) {
      bottomScroller.scrollLeft = tableWrap.scrollLeft;
    }
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
      APPLIED: 'Applied',
      APPLICATION_VIEWED: 'Viewed',
      WAITING_RESPONSE: 'Waiting',
      INTERVIEW_INVITATION: 'Interview',
      REJECTED: 'Rejected',
    };
    return map[status];
  }

  protected statusClass(status: OfferStatus): string {
    const map: Record<OfferStatus, string> = {
      APPLIED: 'applied',
      APPLICATION_VIEWED: 'viewed',
      WAITING_RESPONSE: 'waiting',
      INTERVIEW_INVITATION: 'interview',
      REJECTED: 'rejected',
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
