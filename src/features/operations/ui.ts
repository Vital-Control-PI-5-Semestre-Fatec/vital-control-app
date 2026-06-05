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

export function patientInitials(patientId?: string) {
  if (!patientId) return 'S/P';
  const source = patientId.replace(/^patient-/, '').replace(/^demo-/, '');
  const parts = source.split(/[-_\s.]+/).filter(Boolean);
  if (!parts.length) return 'P.';
  if (parts.length === 1) return `${parts[0].slice(0, 1).toUpperCase()}.`;
  return `${parts[0].slice(0, 1)}.${parts[1].slice(0, 1)}.`.toUpperCase();
}
