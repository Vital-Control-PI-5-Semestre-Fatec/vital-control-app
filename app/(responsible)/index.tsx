import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAuth } from '../../src/providers/AuthProvider';
import { operationsApi } from '../../src/features/operations/api';
import { patientApi } from '../../src/features/patient/api';
import { patientInitials } from '../../src/features/operations/ui';
import type { AdministrationStatus, ApiAdministration } from '../../src/features/patient/api-types';
import { colors } from '../../src/theme/colors';
import { Check, Clock3, User, Users } from 'lucide-react-native';

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

const statusLabel: Record<AdministrationStatus, string> = {
  PENDING: 'Pendente',
  TAKEN_ON_TIME: 'Tomado',
  TAKEN_LATE: 'Tomado com atraso',
  MISSED: 'Não tomado',
  SKIPPED: 'Ignorado',
};

export default function ResponsibleHomeScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = dateKey(new Date());

  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<ApiAdministration | null>(null);
  const [justification, setJustification] = useState('');

  const careGroupsQuery = useQuery({
    queryKey: ['responsible', 'care-groups', session?.user.id],
    queryFn: async () => {
      const allGroups = await operationsApi.getCareGroups(session!.accessToken);
      return allGroups.filter((g) => g.responsibleIds.includes(session!.user.id));
    },
    enabled: !!session,
  });

  const targetPatientId = activePatientId || careGroupsQuery.data?.[0]?.patientIds[0] || null;

  const patientAdministrationsQuery = useQuery({
    queryKey: ['responsible', 'patient-administrations', targetPatientId, todayStr],
    queryFn: () => patientApi.getAdministrations(targetPatientId!, todayStr, session!.accessToken),
    enabled: !!targetPatientId && !!session,
  });

  const updatePatientDoseMutation = useMutation({
    mutationFn: ({ adminId, status, note }: { adminId: string; status: AdministrationStatus; note?: string }) =>
      patientApi.updateAdministrationStatus(targetPatientId!, adminId, { status, justification: note }, session!.accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['responsible', 'patient-administrations', targetPatientId] });
      setActionModalOpen(false);
      setJustification('');
    },
  });

  function openActionModal(admin: ApiAdministration) {
    setSelectedAdmin(admin);
    setJustification(admin.justification ?? '');
    setActionModalOpen(true);
  }

  function handleUpdatePatientStatus(status: AdministrationStatus) {
    if (!selectedAdmin) return;
    updatePatientDoseMutation.mutate({ adminId: selectedAdmin._id, status, note: justification });
  }

  const firstName = session?.user.name.split(' ')[0] ?? 'Responsável';

  return (
    <Screen title={`Olá, ${firstName}`} subtitle="Painel de Monitoramento Familiar">

      <View className="gap-2">
        <Text className="text-base font-bold text-vc-text-dark">Pacientes sob sua responsabilidade</Text>

        {careGroupsQuery.isLoading && <ActivityIndicator color={colors.secondary} />}

        {!careGroupsQuery.isLoading && !careGroupsQuery.data?.flatMap(g => g.patientIds).length && (
          <Card>
            <View className="flex-row items-center gap-4 py-2">
              <Users color={colors.textMuted} size={28} />
              <Text className="text-sm text-vc-text-muted-dark flex-1">
                Nenhum paciente vinculado à sua conta ainda.
              </Text>
            </View>
          </Card>
        )}

        <View className="flex-row flex-wrap gap-2">
          {careGroupsQuery.data?.flatMap(g => g.patientIds).map((pId) => {
            const isSelected = targetPatientId === pId;
            return (
              <Pressable
                key={pId}
                onPress={() => setActivePatientId(pId)}
                className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border ${isSelected ? 'border-vc-secondary-dark bg-vc-surface-raised-dark' : 'border-vc-border-dark bg-vc-surface-dark'}`}
              >
                <User color={isSelected ? colors.secondary : colors.textMuted} size={15} />
                <Text className={`text-xs font-bold ${isSelected ? 'text-vc-secondary-dark' : 'text-vc-text-muted-dark'}`}>
                  Paciente {patientInitials(pId)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {targetPatientId ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase text-vc-text-muted-dark">Rotina de hoje do paciente</Text>
            {patientAdministrationsQuery.isFetching && <ActivityIndicator color={colors.secondary} size="small" />}
          </View>

          {patientAdministrationsQuery.data?.map((item) => {
            const isPending = item.status === 'PENDING';
            const completed = item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE';
            return (
              <Card className="gap-3" key={item._id}>
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-vc-surface-raised-dark">
                    {completed ? <Check color={colors.secondary} size={16} /> : <Clock3 color={colors.primary} size={16} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-vc-text-dark">{item.medicationSnapshot.name}</Text>
                    <Text className="text-xs text-vc-text-muted-dark">
                      {item.medicationSnapshot.dosageDescription} — {new Date(item.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <StatusBadge label={statusLabel[item.status]} tone={completed ? 'success' : item.status === 'MISSED' ? 'danger' : 'info'} />
                </View>
                {isPending && (
                  <Button label="Registrar medicamento" variant="secondary" className="min-h-9 h-9" onPress={() => openActionModal(item)} />
                )}
              </Card>
            );
          })}

          {!patientAdministrationsQuery.isFetching && !patientAdministrationsQuery.data?.length && (
            <Card>
              <View className="flex-row items-center gap-3">
                <Clock3 color={colors.textMuted} size={20} />
                <Text className="text-sm text-vc-text-muted-dark">Nenhuma dose registrada para hoje.</Text>
              </View>
            </Card>
          )}
        </View>
      ) : null}

      <ModalSheet
        title="Registrar dose do paciente"
        subtitle={selectedAdmin?.medicationSnapshot.name}
        visible={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
      >
        <Input label="Observações / Justificativa" placeholder="Ex: Administrado com água após almoço" value={justification} onChangeText={setJustification} />
        <View className="gap-3 mt-4">
          <Button label="Confirmar como tomado" loading={updatePatientDoseMutation.isPending} onPress={() => handleUpdatePatientStatus('TAKEN_ON_TIME')} />
          <Button label="Registrar como atrasado" loading={updatePatientDoseMutation.isPending} onPress={() => handleUpdatePatientStatus('TAKEN_LATE')} variant="secondary" />
          <Button label="Marcar como ignorado" loading={updatePatientDoseMutation.isPending} onPress={() => handleUpdatePatientStatus('SKIPPED')} variant="ghost" />
        </View>
      </ModalSheet>

    </Screen>
  );
}
