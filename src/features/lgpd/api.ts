import { apiRequest } from '../../services/api/client';
import { LgpdDataRequest, PrivacyPolicyDoc, UserConsent } from './types';

export async function fetchPrivacyPolicy(): Promise<PrivacyPolicyDoc> {
  return apiRequest<PrivacyPolicyDoc>('/lgpd/privacy-policy');
}

export async function fetchMyConsents(token: string): Promise<UserConsent[]> {
  return apiRequest<UserConsent[]>('/lgpd/consents', {}, token);
}

export async function recordConsent(
  token: string,
  input: { purpose: string; consented: boolean; version?: string },
): Promise<UserConsent> {
  return apiRequest<UserConsent>(
    '/lgpd/consents',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function submitDataRequest(
  token: string,
  input: { requestType: 'ACCESS_EXPORT' | 'CORRECTION' | 'DELETION'; details?: string },
): Promise<LgpdDataRequest> {
  return apiRequest<LgpdDataRequest>(
    '/lgpd/requests',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function fetchMyDataRequests(token: string): Promise<LgpdDataRequest[]> {
  return apiRequest<LgpdDataRequest[]>('/lgpd/requests/my', {}, token);
}

export async function exportMyData(token: string): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/lgpd/export-my-data', {}, token);
}
