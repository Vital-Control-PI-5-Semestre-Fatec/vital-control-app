import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import { patientApi } from './api';
import type {
  CreateMedicationPayload,
  CreateSchedulePayload,
  StockAdjustmentPayload,
  UpdateMedicationPayload,
  UpdateSchedulePayload,
} from './api';

function usePatientSession() {
  const { session } = useAuth();

  if (!session) {
    throw new Error('Sessão obrigatória.');
  }

  return {
    patientId: session.user.id,
    token: session.accessToken,
  };
}

export function useAdministrations(date: string) {
  const { patientId, token } = usePatientSession();

  return useQuery({
    queryKey: ['administrations', patientId, date],
    queryFn: async () => {
      const schedules = await patientApi.getSchedules(patientId, token);
      const selectedDate = new Date(`${date}T12:00:00`);

      await Promise.all(
        schedules
          .filter((schedule) => schedule.active && appliesToDate(schedule, selectedDate))
          .flatMap((schedule) =>
            schedule.times.map((time) =>
              patientApi.createOccurrence(
                patientId,
                schedule._id,
                new Date(`${date}T${time}:00`).toISOString(),
                token,
              ),
            ),
          ),
      );

      return patientApi.getAdministrations(patientId, date, token);
    },
  });
}

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function appliesToDate(
  schedule: Awaited<ReturnType<typeof patientApi.getSchedules>>[number],
  date: Date,
) {
  const startDate = new Date(schedule.startDate);
  const selectedDay = dateOnly(date);
  const firstDay = dateOnly(startDate);

  if (selectedDay < firstDay) {
    return false;
  }

  if (schedule.endDate) {
    const endDate = new Date(schedule.endDate);
    const lastDay = dateOnly(endDate);

    if (selectedDay > lastDay) {
      return false;
    }
  }

  if (schedule.recurrence.type === 'DAILY') {
    return true;
  }

  if (schedule.recurrence.type === 'WEEKDAYS') {
    return schedule.recurrence.weekdays?.includes(selectedDay.getDay()) ?? false;
  }

  const elapsedDays = Math.floor(
    (selectedDay.getTime() - firstDay.getTime()) / 86_400_000,
  );

  return elapsedDays % (schedule.recurrence.intervalDays ?? 1) === 0;
}

export function useUpdateAdministrationStatus() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      administrationId,
      status,
      justification,
    }: {
      administrationId: string;
      status: import('./api-types').AdministrationStatus;
      justification?: string;
    }) =>
      patientApi.updateAdministrationStatus(
        patientId,
        administrationId,
        { status, justification },
        token,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['administrations', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
      });
    },
  });
}

export function useMedications() {
  const { patientId, token } = usePatientSession();

  return useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => patientApi.getMedications(patientId, token),
  });
}

export function useCreateMedication() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMedicationPayload) =>
      patientApi.createMedication(patientId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
      });
    },
  });
}

export function useUpdateMedication() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicationId,
      payload,
    }: {
      medicationId: string;
      payload: UpdateMedicationPayload;
    }) => patientApi.updateMedication(patientId, medicationId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
      });
    },
  });
}

export function useDeactivateMedication() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medicationId: string) =>
      patientApi.deactivateMedication(patientId, medicationId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['schedules', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['administrations', patientId],
      });
    },
  });
}

export function useAdjustStock() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicationId,
      payload,
    }: {
      medicationId: string;
      payload: StockAdjustmentPayload;
    }) => patientApi.adjustStock(patientId, medicationId, payload, token),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['medication-movements', patientId, variables.medicationId],
      });
    },
  });
}

export function useMedicationMovements(medicationId?: string) {
  const { patientId, token } = usePatientSession();

  return useQuery({
    queryKey: ['medication-movements', patientId, medicationId],
    enabled: !!medicationId,
    queryFn: () => patientApi.getMedicationMovements(patientId, medicationId!, token),
  });
}

export function useSearchMedicationByBarcode() {
  const { patientId, token } = usePatientSession();

  return useMutation({
    mutationFn: (barcode: string) =>
      patientApi.searchMedicationByBarcode(patientId, barcode, token),
  });
}

export function useSchedules() {
  const { patientId, token } = usePatientSession();

  return useQuery({
    queryKey: ['schedules', patientId],
    queryFn: () => patientApi.getSchedules(patientId, token),
  });
}

export function useCreateSchedule() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) =>
      patientApi.createSchedule(patientId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['schedules', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['administrations', patientId],
      });
    },
  });
}

export function useUpdateSchedule() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: UpdateSchedulePayload;
    }) => patientApi.updateSchedule(patientId, scheduleId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['schedules', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['administrations', patientId],
      });
    },
  });
}

export function useDeactivateSchedule() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) =>
      patientApi.deactivateSchedule(patientId, scheduleId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['schedules', patientId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['administrations', patientId],
      });
    },
  });
}

export function usePatientProfile() {
  const { patientId, token } = usePatientSession();

  return useQuery({
    queryKey: ['profile', patientId],
    queryFn: () => patientApi.getProfile(patientId, token),
  });
}

export function useSavePatientProfile() {
  const { patientId, token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: unknown) => patientApi.saveProfile(patientId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['profile', patientId],
      });
    },
  });
}

export function useVisits() {
  const { token } = usePatientSession();

  return useQuery({
    queryKey: ['home-visits'],
    queryFn: () => patientApi.getVisits(token),
  });
}

export function usePatientVisit(visitId?: string) {
  const visits = useVisits();

  return {
    ...visits,
    data: visits.data?.find(
      (visit: import('./api-types').ApiHomeVisit) => visit._id === visitId,
    ),
  };
}

export function useCreateVisit() {
  const { token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: unknown) => patientApi.createVisit(payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['home-visits'],
      });
    },
  });
}

export function useEditVisit() {
  const { token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, payload }: { visitId: string; payload: unknown }) =>
      patientApi.editVisit(visitId, payload, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['home-visits'],
      });
    },
  });
}

export function useCancelVisit() {
  const { token } = usePatientSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitId: string) => patientApi.cancelVisit(visitId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['home-visits'],
      });
    },
  });
}

export function useNotificationDevices() {
  const { token } = usePatientSession();

  return useQuery({
    queryKey: ['notification-devices'],
    queryFn: () => patientApi.getNotificationDevices(token),
  });
}