import { ApiError, apiRequest } from '../../services/api/client';
import { patientApi } from '../patient/api';
import type { ApiHomeVisit } from '../patient/api-types';
import type { AssignVisitPayload, CareGroup, CreateCareGroupPayload, EligibleUser, OperationalHomeVisit, UpdateCareGroupMembersPayload, UpdateVisitStatusPayload, VisitAdministration, VisitMedicationOption } from './api-types';
import { mockAdministrationsByPatient, mockEligibleUsers, mockGroups, mockMedicationsByPatient, mockVisits, removeMockGroup, updateMockVisit, upsertMockGroup } from './mock-data';

function shouldUseMock(error: unknown) {
  return error instanceof ApiError && error.status === 0;
}

function normalizeVisit(visit: ApiHomeVisit): OperationalHomeVisit {
  return { patientId: 'paciente-vinculado', ...visit };
}

function normalizeEligibleUser(user: EligibleUser & { _id?: string; userId?: string }): EligibleUser {
  return {
    id: toIdString(user.id ?? user._id ?? user.userId),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function normalizeCareGroup(group: CareGroup & { id?: string }): CareGroup {
  return {
    ...group,
    _id: toIdString(group.id ?? group._id),
    patientIds: toIdStrings(group.patientIds),
    managerId: toIdString(group.managerId),
    caregiverIds: (group.caregiverIds ?? []).map(toIdString),
    responsibleIds: (group.responsibleIds ?? []).map(toIdString),
    status: group.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  };
}

function toIdString(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if ('$oid' in value) return toIdString(value.$oid);
    if ('id' in value) return toIdString(value.id);
    if ('_id' in value) return toIdString(value._id);
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) return String(value);
  return String(value);
}

function toIdStrings(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map(toIdString).filter(Boolean);
}

export const operationsApi = {
  async getVisits(token: string) {
    if (token === 'demo-token') return mockVisits;
    try {
      const visits = await apiRequest<ApiHomeVisit[]>('/home-visits/mine', {}, token);
      return visits.map(normalizeVisit);
    } catch (error) {
      if (shouldUseMock(error)) return mockVisits;
      throw error;
    }
  },

  async assignVisit(visitId: string, payload: AssignVisitPayload, token: string) {
    if (token === 'demo-token') return updateMockVisit(visitId, { ...payload, status: 'SCHEDULED' })!;
    return normalizeVisit(await apiRequest<ApiHomeVisit>(`/home-visits/${visitId}/assign`, { method: 'PATCH', body: JSON.stringify(payload) }, token));
  },

  async updateVisitStatus(visitId: string, payload: UpdateVisitStatusPayload, token: string) {
    if (token === 'demo-token') return updateMockVisit(visitId, payload)!;
    try {
      return normalizeVisit(await apiRequest<ApiHomeVisit>(`/home-visits/${visitId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }, token));
    } catch (error) {
      if (shouldUseMock(error)) return updateMockVisit(visitId, payload)!;
      throw error;
    }
  },

  async cancelVisit(visitId: string, caregiverNotes: string, token: string) {
    const patch = { status: 'CANCELLED' as const, caregiverNotes };
    if (token === 'demo-token') return updateMockVisit(visitId, patch)!;
    try {
      return normalizeVisit(await apiRequest<ApiHomeVisit>(`/home-visits/${visitId}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: caregiverNotes }) }, token));
    } catch (error) {
      if (shouldUseMock(error)) return updateMockVisit(visitId, patch)!;
      throw error;
    }
  },

  async getCareGroups(token: string) {
    if (token === 'demo-token') return mockGroups;
    const groups = await apiRequest<Array<CareGroup & { id?: string }>>('/care-groups/mine', {}, token);
    return groups.map(normalizeCareGroup);
  },

  async createCareGroup(payload: CreateCareGroupPayload, token: string) {
    if (token === 'demo-token') return upsertMockGroup({ _id: `group-${Date.now()}`, managerId: 'demo-manager', status: 'ACTIVE', ...payload });
    const group = await apiRequest<CareGroup & { id?: string }>('/care-groups', { method: 'POST', body: JSON.stringify(payload) }, token);
    return normalizeCareGroup(group);
  },

  async updateCareGroupMembers(groupId: string, payload: UpdateCareGroupMembersPayload, token: string) {
    if (token === 'demo-token') return upsertMockGroup({ ...mockGroups.find((group) => group._id === groupId)!, ...payload });
    const group = await apiRequest<CareGroup & { id?: string }>(`/care-groups/${groupId}/members`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
    return normalizeCareGroup(group);
  },

  async updateCareGroupStatus(groupId: string, status: CareGroup['status'], token: string) {
    if (token === 'demo-token') return upsertMockGroup({ ...mockGroups.find((group) => group._id === groupId)!, status });
    const group = await apiRequest<CareGroup & { id?: string }>(`/care-groups/${groupId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
    return normalizeCareGroup(group);
  },

  async deleteCareGroup(groupId: string, token: string) {
    if (token === 'demo-token') {
      removeMockGroup(groupId);
      return;
    }
    await apiRequest<void>(`/care-groups/${groupId}`, { method: 'DELETE' }, token);
  },

  async getEligibleUsers(role: EligibleUser['role'], token: string) {
    if (token === 'demo-token') return mockEligibleUsers.filter((user) => user.role === role);
    const users = await apiRequest<Array<EligibleUser & { _id?: string; userId?: string }>>(`/users/eligible?role=${role}`, {}, token);
    return users.map(normalizeEligibleUser).filter((user) => user.id);
  },

  async getPatientMedications(patientId: string, token: string): Promise<VisitMedicationOption[]> {
    if (token === 'demo-token') return mockMedicationsByPatient[patientId] ?? [];
    try {
      return await patientApi.getMedications(patientId, token);
    } catch (error) {
      if (shouldUseMock(error)) return mockMedicationsByPatient[patientId] ?? [];
      throw error;
    }
  },

  async getPatientAdministrations(patientId: string, token: string): Promise<VisitAdministration[]> {
    if (token === 'demo-token') return mockAdministrationsByPatient[patientId] ?? [];
    try {
      return await patientApi.getAdministrations(patientId, new Date().toISOString().slice(0, 10), token);
    } catch (error) {
      if (shouldUseMock(error)) return mockAdministrationsByPatient[patientId] ?? [];
      throw error;
    }
  },

  async takeAdministration(patientId: string, administrationId: string, notes: string | undefined, token: string) {
    if (token === 'demo-token') {
      mockAdministrationsByPatient[patientId] = (mockAdministrationsByPatient[patientId] ?? []).map((item) => (item._id === administrationId ? { ...item, status: 'TAKEN_ON_TIME' } : item));
      return mockAdministrationsByPatient[patientId].find((item) => item._id === administrationId)!;
    }
    return apiRequest<VisitAdministration>(`/patients/${patientId}/administrations/${administrationId}/take`, { method: 'PATCH', body: JSON.stringify({ notes }) }, token);
  },
};
