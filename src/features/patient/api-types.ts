export interface ApiMedication {
  _id: string;
  name: string;
  dosageDescription: string;
  barcode?: string;
  brand?: string;
  notes?: string;
  imageUrl?: string;
  registrationSource?: 'MANUAL' | 'COSMOS';
  stock: { currentQuantity: number; unit: string; lowStockThreshold?: number };
  active: boolean;
}

export type ScheduleRecurrenceType = 'DAILY' | 'WEEKDAYS' | 'INTERVAL_DAYS';

export interface ApiSchedule {
  _id: string;
  medicationId: string;
  title: string;
  dose: { quantity: number; unit: string };
  times: string[];
  recurrence: {
    type: ScheduleRecurrenceType;
    weekdays?: number[];
    intervalDays?: number;
  };
  startDate: string;
  endDate?: string;
  timezone: string;
  instructions?: string;
  active: boolean;
}

export type AdministrationStatus =
  | 'PENDING'
  | 'TAKEN_ON_TIME'
  | 'TAKEN_LATE'
  | 'MISSED'
  | 'SKIPPED';

export interface ApiAdministration {
  _id: string;
  medicationId: string;
  scheduleId: string;
  scheduledFor: string;
  status: AdministrationStatus;
  justification?: string;
  medicationSnapshot: {
    name: string;
    dosageDescription: string;
    dose: { quantity: number; unit: string };
  };
}

export interface ApiAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ApiEmergencyContact {
  name: string;
  phone: string;
}

export interface ApiPatientProfile {
  bloodType?: string;
  weightKg?: number;
  heightCm?: number;
  allergies: string[];
  preExistingConditions: string[];
  defaultAddress?: ApiAddress;
  emergencyContacts?: ApiEmergencyContact[];
  timezone: string;
}

export interface ApiHomeVisit {
  _id: string;
  reason: string;
  patientNotes?: string;
  requestedWindow: { start: string; end: string };
  scheduledWindow?: { start: string; end: string };
  addressSnapshot: ApiAddress;
  assignedCaregiverId?: string;
  status:
    | 'REQUESTED'
    | 'TRIAGED'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW';
}

export interface ApiNotificationDevice {
  _id: string;
  pushToken: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  deviceName?: string;
}