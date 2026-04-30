export type OfferStatus = 'SENT' | 'VIEWED' | 'REJECTED' | 'ACTIVE' | 'INTERVIEW_INVITATION';

export interface JobApplication {
  id: number;
  companyName: string;
  jobTitle?: string;
  platform?: string;
  appliedDate?: string;
  offerStatus: OfferStatus;
  mark?: number;
  jd?: string;
  resumeVersion?: string;
  emailSubject?: string;
  emailFrom?: string;
  snippet?: string;
}

export interface ApplicationSearchParams {
  appliedAfter?: string;
  companyName?: string;
  offerStatus?: OfferStatus;
  resumeVersion?: string;
  platform?: string;
}

export interface ApplicationUpdateRequest {
  companyName?: string;
  jobTitle?: string;
  platform?: string;
  appliedDate?: string;
  offerStatus?: OfferStatus;
  mark?: number;
  jd?: string;
  resumeVersion?: string;
  emailSubject?: string;
  emailFrom?: string;
  snippet?: string;
}
