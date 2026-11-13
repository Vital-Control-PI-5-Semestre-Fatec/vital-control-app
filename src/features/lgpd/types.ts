export interface UserConsent {
  _id?: string;
  id?: string;
  userId: string;
  purpose: string;
  consented: boolean;
  version: string;
  consentedAt: string;
  revokedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LgpdDataRequest {
  _id?: string;
  id?: string;
  userId: string;
  requestType: 'ACCESS_EXPORT' | 'CORRECTION' | 'DELETION';
  details?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  responseNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrivacyPolicyDoc {
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  legalBases: string[];
  collectedData: { category: string; fields: string[]; purpose: string }[];
  dataSubjectRights: string[];
  securityMeasures: string[];
  retentionPeriod: string;
  dpoContact: { role: string; email: string };
}

