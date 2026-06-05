import type { ApiAdministration, ApiHomeVisit } from '../patient/api-types';

export type HomeVisitStatus = ApiHomeVisit['status'];

export interface OperationalHomeVisit extends ApiHomeVisit {
  patientId: string;
  careGroupId?: string;
  managerId?: string;
  assignedCaregiverId?: string;
  caregiverNotes?: string;
}

export interface CareGroup {
  _id: string;
  id?: string;
  name: string;
  patientIds: string[];
  managerId: string;
  caregiverIds: string[];
  responsibleIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EligibleUser {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'CAREGIVER' | 'RESPONSIBLE';
}

export interface AssignVisitPayload {
  careGroupId: string;
  assignedCaregiverId: string;
  scheduledWindow: { start: string; end: string };
}

export interface UpdateVisitStatusPayload {
  status: Extract<HomeVisitStatus, 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW'>;
  caregiverNotes?: string;
}

export interface CreateCareGroupPayload {
  name: string;
  patientIds: string[];
  caregiverIds: string[];
  responsibleIds: string[];
}

export interface UpdateCareGroupMembersPayload {
  patientIds: string[];
  caregiverIds: string[];
  responsibleIds: string[];
}

export interface VisitMedicationOption {
  _id: string;
  name: string;
  dosageDescription: string;
}

export interface PatientInitials {
  initials: string;
  patientId: string;
}

export type VisitAdministration = ApiAdministration;
