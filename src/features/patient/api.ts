import { apiRequest } from '../../services/api/client';
import type {
  AdministrationStatus,
  ApiAdministration,
  ApiHomeVisit,
  ApiMedication,
  ApiNotificationDevice,
  ApiPatientProfile,
  ApiSchedule,
} from './api-types';

export type StockAdjustmentType =
  | 'PURCHASE'
  | 'MANUAL_ADJUSTMENT_IN'
  | 'MANUAL_ADJUSTMENT_OUT'
  | 'DISCARD';

export interface StockAdjustmentPayload {
  type: StockAdjustmentType;
  quantity: number;
  reason?: string;
}

export interface ApiStockMovement {
  _id: string;
  patientId: string;
  medicationId: string;
  type: string;
  direction: 'IN' | 'OUT';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  occurredAt?: string;
  createdAt?: string;
}

export interface CreateMedicationPayload {
  name: string;
  dosageDescription: string;
  unit: string;
  currentQuantity: number;
  lowStockThreshold?: number;
  barcode?: string;
  brand?: string;
  notes?: string;
  imageUrl?: string;
  registrationSource?: 'MANUAL' | 'COSMOS';
}

export interface UpdateMedicationPayload {
  name?: string;
  dosageDescription?: string;
  unit?: string;
  lowStockThreshold?: number;
  barcode?: string;
  brand?: string;
  notes?: string;
  imageUrl?: string;
  registrationSource?: 'MANUAL' | 'COSMOS';
}

export interface CreateSchedulePayload {
  medicationId: string;
  title: string;
  dose: {
    quantity: number;
    unit: string;
  };
  times: string[];
  recurrence: {
    type: 'DAILY' | 'WEEKDAYS' | 'INTERVAL_DAYS';
    weekdays?: number[];
    intervalDays?: number;
  };
  startDate: string;
  endDate?: string;
  timezone?: string;
  instructions?: string;
}

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

export const patientApi = {
  getAdministrations: (patientId: string, date: string, token: string) =>
    apiRequest<ApiAdministration[]>(
      `/patients/${patientId}/administrations?date=${date}`,
      {},
      token,
    ),

  createOccurrence: (
    patientId: string,
    scheduleId: string,
    scheduledFor: string,
    token: string,
  ) =>
    apiRequest<ApiAdministration>(
      `/patients/${patientId}/schedules/${scheduleId}/occurrences`,
      {
        method: 'POST',
        body: JSON.stringify({ scheduledFor }),
      },
      token,
    ),

  updateAdministrationStatus: (
    patientId: string,
    administrationId: string,
    payload: { status: AdministrationStatus; justification?: string },
    token: string,
  ) =>
    apiRequest<ApiAdministration>(
      `/patients/${patientId}/administrations/${administrationId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    ),

  getMedications: (patientId: string, token: string) =>
    apiRequest<ApiMedication[]>(`/patients/${patientId}/medications`, {}, token),

  createMedication: (
    patientId: string,
    payload: CreateMedicationPayload,
    token: string,
  ) =>
    apiRequest<ApiMedication>(
      `/patients/${patientId}/medications`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),

  updateMedication: (
    patientId: string,
    medicationId: string,
    payload: UpdateMedicationPayload,
    token: string,
  ) =>
    apiRequest<ApiMedication>(
      `/patients/${patientId}/medications/${medicationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    ),

  deactivateMedication: (patientId: string, medicationId: string, token: string) =>
    apiRequest<ApiMedication>(
      `/patients/${patientId}/medications/${medicationId}/deactivate`,
      {
        method: 'PATCH',
        body: '{}',
      },
      token,
    ),

  adjustStock: (
    patientId: string,
    medicationId: string,
    payload: StockAdjustmentPayload,
    token: string,
  ) =>
    apiRequest<ApiMedication>(
      `/patients/${patientId}/medications/${medicationId}/stock`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    ),

  getMedicationMovements: (
    patientId: string,
    medicationId: string,
    token: string,
  ) =>
    apiRequest<ApiStockMovement[]>(
      `/patients/${patientId}/medications/${medicationId}/movements`,
      {},
      token,
    ),

  searchMedicationByBarcode: (
    patientId: string,
    barcode: string,
    token: string,
  ) =>
    apiRequest<unknown>(
      `/patients/${patientId}/medications/search-barcode/${barcode}`,
      {},
      token,
    ),

  getSchedules: (patientId: string, token: string) =>
    apiRequest<ApiSchedule[]>(`/patients/${patientId}/schedules`, {}, token),

  createSchedule: (
    patientId: string,
    payload: CreateSchedulePayload,
    token: string,
  ) =>
    apiRequest<ApiSchedule>(
      `/patients/${patientId}/schedules`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),

  updateSchedule: (
    patientId: string,
    scheduleId: string,
    payload: UpdateSchedulePayload,
    token: string,
  ) =>
    apiRequest<ApiSchedule>(
      `/patients/${patientId}/schedules/${scheduleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    ),

  deactivateSchedule: (patientId: string, scheduleId: string, token: string) =>
    apiRequest<ApiSchedule>(
      `/patients/${patientId}/schedules/${scheduleId}/deactivate`,
      {
        method: 'PATCH',
        body: '{}',
      },
      token,
    ),

  getProfile: (patientId: string, token: string) =>
    apiRequest<ApiPatientProfile | null>(
      `/patients/${patientId}/profile`,
      {},
      token,
    ),

  saveProfile: (patientId: string, payload: unknown, token: string) =>
    apiRequest<ApiPatientProfile>(
      `/patients/${patientId}/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token,
    ),

  getVisits: (token: string) =>
    apiRequest<ApiHomeVisit[]>('/home-visits/mine', {}, token),

  createVisit: (payload: unknown, token: string) =>
    apiRequest<ApiHomeVisit>(
      '/home-visits',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),

  editVisit: (visitId: string, payload: unknown, token: string) =>
    apiRequest<ApiHomeVisit>(
      `/home-visits/${visitId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token,
    ),

  cancelVisit: (visitId: string, token: string) =>
    apiRequest<ApiHomeVisit>(
      `/home-visits/${visitId}/cancel`,
      {
        method: 'PATCH',
        body: '{}',
      },
      token,
    ),

  getNotificationDevices: (token: string) =>
    apiRequest<ApiNotificationDevice[]>('/notification-devices', {}, token),
};