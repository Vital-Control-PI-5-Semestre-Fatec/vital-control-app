import type { CareGroup, EligibleUser, OperationalHomeVisit, VisitAdministration, VisitMedicationOption } from './api-types';

const now = new Date();
const isoAt = (dayOffset: number, hour: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0).toISOString();

export let mockVisits: OperationalHomeVisit[] = [
  {
    _id: 'visit-requested-1',
    patientId: 'patient-ana',
    careGroupId: 'group-ana',
    managerId: 'demo-manager',
    reason: 'Apoio na rotina da tarde',
    patientNotes: 'Usar interfone 42. Paciente prefere contato por mensagem.',
    requestedWindow: { start: isoAt(0, 13), end: isoAt(0, 16) },
    addressSnapshot: { street: 'Rua das Flores', number: '120', city: 'Sao Paulo', state: 'SP', zipCode: '01001000' },
    status: 'REQUESTED',
  },
  {
    _id: 'visit-scheduled-1',
    patientId: 'patient-bruno',
    careGroupId: 'group-bruno',
    managerId: 'demo-manager',
    assignedCaregiverId: 'demo-caregiver',
    reason: 'Acompanhamento de medicação',
    patientNotes: 'Entrada pela portaria social.',
    caregiverNotes: 'Confirmado com a portaria.',
    requestedWindow: { start: isoAt(1, 8), end: isoAt(1, 12) },
    scheduledWindow: { start: isoAt(1, 9), end: isoAt(1, 10) },
    addressSnapshot: { street: 'Av. Central', number: '88', city: 'Sao Paulo', state: 'SP', zipCode: '01310000' },
    status: 'SCHEDULED',
  },
  {
    _id: 'visit-progress-1',
    patientId: 'patient-clara',
    careGroupId: 'group-clara',
    managerId: 'demo-manager',
    assignedCaregiverId: 'demo-caregiver',
    reason: 'Visita de administração assistida',
    requestedWindow: { start: isoAt(0, 9), end: isoAt(0, 11) },
    scheduledWindow: { start: isoAt(0, 10), end: isoAt(0, 11) },
    addressSnapshot: { street: 'Rua Horizonte', number: '310', city: 'Sao Paulo', state: 'SP', zipCode: '04000000' },
    status: 'IN_PROGRESS',
  },
];

export let mockGroups: CareGroup[] = [
  { _id: 'group-ana', name: 'Grupo A.L.', patientIds: ['patient-ana'], managerId: 'demo-manager', caregiverIds: ['demo-caregiver'], responsibleIds: ['responsible-luiz'], status: 'ACTIVE' },
  { _id: 'group-bruno', name: 'Grupo B.M.', patientIds: ['patient-bruno'], managerId: 'demo-manager', caregiverIds: ['demo-caregiver'], responsibleIds: ['responsible-maria'], status: 'ACTIVE' },
  { _id: 'group-clara', name: 'Grupo C.R.', patientIds: ['patient-clara'], managerId: 'demo-manager', caregiverIds: ['demo-caregiver'], responsibleIds: [], status: 'ACTIVE' },
];

export const mockEligibleUsers: EligibleUser[] = [
  { id: 'patient-davi', name: 'Davi Nunes', email: 'davi@example.com', role: 'PATIENT' },
  { id: 'patient-ana', name: 'Ana Lima', email: 'ana@example.com', role: 'PATIENT' },
  { id: 'caregiver-joana', name: 'Joana Souza', email: 'joana@example.com', role: 'CAREGIVER' },
  { id: 'demo-caregiver', name: 'Cuidador Demo', email: 'cuidador@example.com', role: 'CAREGIVER' },
  { id: 'responsible-luiz', name: 'Luiz Lima', email: 'luiz@example.com', role: 'RESPONSIBLE' },
  { id: 'responsible-maria', name: 'Maria Martins', email: 'maria@example.com', role: 'RESPONSIBLE' },
];

export const mockMedicationsByPatient: Record<string, VisitMedicationOption[]> = {
  'patient-clara': [{ _id: 'med-losartana', name: 'Losartana', dosageDescription: '50 mg' }],
  'patient-bruno': [{ _id: 'med-metformina', name: 'Metformina', dosageDescription: '850 mg' }],
};

export let mockAdministrationsByPatient: Record<string, VisitAdministration[]> = {
  'patient-clara': [
    {
      _id: 'admin-clara-losartana',
      medicationId: 'med-losartana',
      scheduleId: 'schedule-clara-1',
      scheduledFor: isoAt(0, 10),
      status: 'PENDING',
      medicationSnapshot: { name: 'Losartana', dosageDescription: '50 mg', dose: { quantity: 1, unit: 'TABLET' } },
    },
  ],
};

export function updateMockVisit(id: string, patch: Partial<OperationalHomeVisit>) {
  mockVisits = mockVisits.map((visit) => (visit._id === id ? { ...visit, ...patch } : visit));
  return mockVisits.find((visit) => visit._id === id);
}

export function upsertMockGroup(group: CareGroup) {
  const exists = mockGroups.some((item) => item._id === group._id);
  mockGroups = exists ? mockGroups.map((item) => (item._id === group._id ? group : item)) : [group, ...mockGroups];
  return group;
}

export function removeMockGroup(groupId: string) {
  mockGroups = mockGroups.filter((group) => group._id !== groupId);
}
