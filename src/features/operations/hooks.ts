import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../providers/AuthProvider';
import type { AssignVisitPayload, CareGroup, CreateCareGroupPayload, EligibleUser, UpdateCareGroupMembersPayload, UpdateVisitStatusPayload } from './api-types';
import { operationsApi } from './api';

function useOperationSession() {
  const { session } = useAuth();
  if (!session) throw new Error('Sessao obrigatoria.');
  return { token: session.accessToken, user: session.user };
}

export function useOperationalVisits() {
  const { token, user } = useOperationSession();

  return useQuery({
    queryKey: ['operations', 'home-visits', user.role, user.id],
    queryFn: () => operationsApi.getVisits(token),
  });
}

export function useOperationalVisit(visitId?: string) {
  const visits = useOperationalVisits();
  return { ...visits, data: visits.data?.find((visit) => visit._id === visitId) };
}

export function useAssignVisit() {
  const { token } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, payload }: { visitId: string; payload: AssignVisitPayload }) => operationsApi.assignVisit(visitId, payload, token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['operations', 'home-visits'] }),
  });
}

export function useUpdateVisitStatus() {
  const { token } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, payload }: { visitId: string; payload: UpdateVisitStatusPayload }) => operationsApi.updateVisitStatus(visitId, payload, token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['operations', 'home-visits'] }),
  });
}

export function useCancelVisit() {
  const { token } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, notes }: { visitId: string; notes: string }) => operationsApi.cancelVisit(visitId, notes, token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['operations', 'home-visits'] }),
  });
}

export function useCareGroups() {
  const { token, user } = useOperationSession();
  return useQuery({
    queryKey: ['operations', 'care-groups', user.id],
    queryFn: async () => (await operationsApi.getCareGroups(token)).filter((group) => group.managerId === user.id),
  });
}

export function useCreateCareGroup() {
  const { token, user } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCareGroupPayload) => operationsApi.createCareGroup(payload, token),
    onSuccess: (group) => {
      queryClient.setQueryData<CareGroup[]>(['operations', 'care-groups', user.id], (current) => {
        const groupId = group.id ?? group._id;
        return current
          ? [group, ...current.filter((item) => (item.id ?? item._id) !== groupId)]
          : [group];
      });

      void queryClient.invalidateQueries({ queryKey: ['operations', 'care-groups'] });
    },
  });
}

export function useUpdateCareGroupMembers() {
  const { token, user } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: UpdateCareGroupMembersPayload }) => operationsApi.updateCareGroupMembers(groupId, payload, token),
    onSuccess: (group) => {
      queryClient.setQueryData<CareGroup[]>(['operations', 'care-groups', user.id], (current) => current?.map((item) => (item._id === group._id ? group : item)) ?? [group]);
      void queryClient.invalidateQueries({ queryKey: ['operations', 'care-groups'] });
    },
  });
}

export function useUpdateCareGroupStatus() {
  const { token, user } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, status }: { groupId: string; status: CareGroup['status'] }) => operationsApi.updateCareGroupStatus(groupId, status, token),
    onSuccess: (group) => {
      queryClient.setQueryData<CareGroup[]>(['operations', 'care-groups', user.id], (current) => current?.map((item) => (item._id === group._id ? group : item)) ?? [group]);
      void queryClient.invalidateQueries({ queryKey: ['operations', 'care-groups'] });
    },
  });
}

export function useDeleteCareGroup() {
  const { token, user } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => operationsApi.deleteCareGroup(groupId, token),
    onSuccess: (_, groupId) => {
      queryClient.setQueryData<CareGroup[]>(['operations', 'care-groups', user.id], (current) => current?.filter((item) => item._id !== groupId) ?? []);
      void queryClient.invalidateQueries({ queryKey: ['operations', 'care-groups'] });
    },
  });
}

export function useEligibleUsers(role: EligibleUser['role']) {
  const { token } = useOperationSession();
  return useQuery({ queryKey: ['operations', 'eligible-users', role], queryFn: () => operationsApi.getEligibleUsers(role, token) });
}

export function useVisitMedicationContext(patientId?: string) {
  const { token } = useOperationSession();
  return useQuery({
    enabled: Boolean(patientId),
    queryKey: ['operations', 'visit-medication-context', patientId],
    queryFn: async () => ({
      medications: await operationsApi.getPatientMedications(patientId!, token),
      administrations: await operationsApi.getPatientAdministrations(patientId!, token),
    }),
  });
}

export function useTakeVisitAdministration(patientId?: string) {
  const { token } = useOperationSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ administrationId, notes }: { administrationId: string; notes?: string }) => operationsApi.takeAdministration(patientId!, administrationId, notes, token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['operations', 'visit-medication-context', patientId] }),
  });
}
