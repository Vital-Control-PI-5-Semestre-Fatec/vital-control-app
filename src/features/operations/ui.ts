import type { HomeVisitStatus, OperationalHomeVisit } from './api-types';

export const visitStatusLabel: Record<HomeVisitStatus, string> = {
  REQUESTED: 'Solicitado',
  TRIAGED: 'Triado',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Ausente',
};

export function visitStatusTone(status: HomeVisitStatus) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'danger' as const;
  if (status === 'REQUESTED' || status === 'TRIAGED') return 'warning' as const;
  return 'info' as const;
}

export function visitWindow(visit: OperationalHomeVisit) {
  return visit.scheduledWindow ?? visit.requestedWindow;
}

export function formatVisitWindow(visit: OperationalHomeVisit) {
  const window = visitWindow(visit);
  return `${new Date(window.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} - ${new Date(window.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function dateKeyFromIso(iso: string) {
  return dateKeyFromDate(new Date(iso));
}

export function visitDateKey(visit: OperationalHomeVisit) {
  return dateKeyFromIso(visitWindow(visit).start);
}

export function visitTimeRange(visit: OperationalHomeVisit) {
  const window = visitWindow(visit);
  return `${new Date(window.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(window.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function buildDateFilters(days = 5) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: index === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
  });
}

export function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function buildCenteredDateFilters(centerDate: Date, radius = 2) {
  return Array.from({ length: radius * 2 + 1 }, (_, index) => index - radius).map((offset) => {
    const date = addDays(centerDate, offset);
    return {
      key: dateKeyFromDate(date),
      label: offset === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'long' }),
      shortLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
  });
}

const IGNORED_NAME_PARTICLES = new Set(['da', 'de', 'di', 'do', 'das', 'dos', 'e']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const patientInitialsRegistry = new Map<string, string>();

export function formatNameInitials(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'S/P';
  const trimmed = fullName.trim();
  if (/^([A-ZÀ-Ú]\.)+$/.test(trimmed)) return trimmed;
  const parts = trimmed
    .split(/[-_\s.]+/)
    .filter((part) => part.length > 0 && !IGNORED_NAME_PARTICLES.has(part.toLowerCase()));
  if (!parts.length) return 'P.';
  return `${parts.map((part) => part.slice(0, 1).toUpperCase()).join('.')}.`;
}

export function registerPatientInitials(patientId?: string, initialsOrName?: string) {
  if (!patientId || !initialsOrName) return;
  const formatted = formatNameInitials(initialsOrName);
  if (formatted && formatted !== 'S/P') {
    patientInitialsRegistry.set(patientId, formatted);
  }
}

export function registerPatientInitialsMap(map?: Record<string, string>) {
  if (!map) return;
  for (const [id, initials] of Object.entries(map)) {
    registerPatientInitials(id, initials);
  }
}

export function patientInitials(patientId?: string, explicitInitials?: unknown) {
  if (typeof explicitInitials === 'string' && explicitInitials.trim()) {
    return formatNameInitials(explicitInitials);
  }
  if (!patientId) return 'S/P';
  const cached = patientInitialsRegistry.get(patientId);
  if (cached) return cached;
  if (UUID_REGEX.test(patientId.trim())) return 'P.';
  const source = patientId.replace(/^patient-/, '').replace(/^demo-/, '');
  return formatNameInitials(source);
}
