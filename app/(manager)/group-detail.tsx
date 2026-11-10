import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, UserRound, UsersRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EligibleUserPicker } from '../../src/features/operations/components/EligibleUserPicker';
import { useCareGroups, useDeleteCareGroup, useEligibleUsers, useUpdateCareGroupMembers, useUpdateCareGroupStatus } from '../../src/features/operations/hooks';
import { colors } from '../../src/theme/colors';

export default function ManagerGroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groups = useCareGroups();
  const patients = useEligibleUsers('PATIENT');
  const caregivers = useEligibleUsers('CAREGIVER');
  const responsibles = useEligibleUsers('RESPONSIBLE');
  const updateMembers = useUpdateCareGroupMembers();
  const updateStatus = useUpdateCareGroupStatus();
  const deleteGroup = useDeleteCareGroup();
  const group = groups.data?.find((item) => item._id === id);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [caregiverIds, setCaregiverIds] = useState<string[]>([]);
  const [responsibleIds, setResponsibleIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!group) return;
    setPatientIds(group.patientIds);
    setCaregiverIds(group.caregiverIds);
    setResponsibleIds(group.responsibleIds);
  }, [group?._id, group?.patientIds.join(','), group?.caregiverIds.join(','), group?.responsibleIds.join(',')]);

  function saveMembers() {
    setSaved(false);
    updateMembers.mutate(
      { groupId: group!._id, payload: { patientIds, caregiverIds, responsibleIds } },
      { onSuccess: () => setSaved(true) },
    );
  }

  function confirmStatusChange() {
    const nextStatus = group!.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    Alert.alert(
      nextStatus === 'INACTIVE' ? 'Desativar grupo?' : 'Reativar grupo?',
      nextStatus === 'INACTIVE'
        ? 'Os vínculos deixam de conceder acesso enquanto o grupo estiver inativo.'
        : 'Os vínculos voltarão a conceder acesso aos integrantes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: nextStatus === 'INACTIVE' ? 'Desativar' : 'Reativar', onPress: () => updateStatus.mutate({ groupId: group!._id, status: nextStatus }) },
      ],
    );
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir grupo permanentemente?',
      'Esta ação remove o grupo e não pode ser desfeita. Prefira desativar para preservar o histórico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteGroup.mutate(group!._id, { onSuccess: () => router.back() }) },
      ],
    );
  }

  if (groups.isFetching && !group) return <Screen title="Grupo"><ActivityIndicator color={colors.secondary} /></Screen>;
  if (!group) return <Screen title="Grupo"><Card><Text className="text-sm text-vc-text-muted-dark">Grupo não encontrado.</Text></Card><Button label="Voltar" onPress={() => router.back()} variant="ghost" /></Screen>;

  return (
    <Screen title={group.name} subtitle="Gerencie pacientes e permissões deste grupo.">
      <Card className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-sm font-bold text-vc-text-dark">Situação do grupo</Text>
            <Text className="text-xs leading-5 text-vc-text-muted-dark">{group.status === 'ACTIVE' ? 'Os integrantes possuem acesso conforme seus papéis.' : 'Os vínculos estão pausados e não concedem acesso.'}</Text>
          </View>
          <StatusBadge label={group.status === 'ACTIVE' ? 'Ativo' : 'Inativo'} tone={group.status === 'ACTIVE' ? 'success' : 'danger'} />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-xl bg-vc-bg-dark p-3"><Text className="text-lg font-bold text-vc-primary-dark">{patientIds.length}</Text><Text className="text-xs text-vc-text-muted-dark">Pacientes</Text></View>
          <View className="flex-1 rounded-xl bg-vc-bg-dark p-3"><Text className="text-lg font-bold text-vc-secondary-dark">{caregiverIds.length}</Text><Text className="text-xs text-vc-text-muted-dark">Cuidadores</Text></View>
          <View className="flex-1 rounded-xl bg-vc-bg-dark p-3"><Text className="text-lg font-bold text-vc-warning-dark">{responsibleIds.length}</Text><Text className="text-xs text-vc-text-muted-dark">Responsáveis</Text></View>
        </View>
      </Card>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3"><UserRound color={colors.primary} size={19} /><View className="flex-1"><Text className="text-base font-bold text-vc-text-dark">Pacientes</Text><Text className="text-xs text-vc-text-muted-dark">Pessoas que recebem cuidado neste grupo.</Text></View></View>
        {patients.isFetching && <ActivityIndicator color={colors.secondary} />}
        {patients.error && <Text className="text-xs text-vc-danger-dark">{patients.error.message}</Text>}
        <EligibleUserPicker emptyMessage="Nenhum paciente elegível encontrado." label="Pacientes vinculados" multiple onChange={setPatientIds} required selectedIds={patientIds} users={patients.data ?? []} />
      </Card>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3"><UsersRound color={colors.secondary} size={19} /><View className="flex-1"><Text className="text-base font-bold text-vc-text-dark">Cuidadores</Text><Text className="text-xs text-vc-text-muted-dark">Podem receber atribuições e realizar atendimentos.</Text></View></View>
        {caregivers.isFetching && <ActivityIndicator color={colors.secondary} />}
        {caregivers.error && <Text className="text-xs text-vc-danger-dark">{caregivers.error.message}</Text>}
        <EligibleUserPicker emptyMessage="Nenhum cuidador elegível encontrado." label="Cuidadores vinculados" multiple onChange={setCaregiverIds} selectedIds={caregiverIds} users={caregivers.data ?? []} />
      </Card>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3"><ShieldCheck color={colors.warning} size={19} /><View className="flex-1"><Text className="text-base font-bold text-vc-text-dark">Responsáveis</Text><Text className="text-xs text-vc-text-muted-dark">Acompanham informações dos pacientes em modo de leitura.</Text></View></View>
        {responsibles.isFetching && <ActivityIndicator color={colors.secondary} />}
        {responsibles.error && <Text className="text-xs text-vc-danger-dark">{responsibles.error.message}</Text>}
        <EligibleUserPicker emptyMessage="Nenhum responsável elegível encontrado." label="Responsáveis vinculados" multiple onChange={setResponsibleIds} selectedIds={responsibleIds} users={responsibles.data ?? []} />
      </Card>
      <Button disabled={!patientIds.length} label="Salvar alterações" loading={updateMembers.isPending} onPress={saveMembers} />
      {saved && <Text className="text-xs font-semibold text-vc-secondary-dark">Vínculos salvos com sucesso.</Text>}
      {updateMembers.error && <Text className="text-xs text-vc-danger-dark">{updateMembers.error.message}</Text>}
      <Card className="gap-3 border-vc-danger-dark">
        <Text className="text-base font-bold text-vc-text-dark">Ações do grupo</Text>
        <Text className="text-xs leading-5 text-vc-text-muted-dark">Desativar preserva o grupo e pausa seus acessos. Excluir remove o grupo permanentemente.</Text>
        <View className="flex-row gap-2">
          <View className="flex-1"><Button label={group.status === 'ACTIVE' ? 'Desativar' : 'Reativar'} loading={updateStatus.isPending} onPress={confirmStatusChange} variant="ghost" /></View>
          <View className="flex-1"><Button label="Excluir" loading={deleteGroup.isPending} onPress={confirmDelete} variant="danger" /></View>
        </View>
        {(updateStatus.error || deleteGroup.error) && <Text className="text-xs text-vc-danger-dark">{updateStatus.error?.message ?? deleteGroup.error?.message}</Text>}
      </Card>
    </Screen>
  );
}
