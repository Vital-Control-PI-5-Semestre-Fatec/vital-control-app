import { Link } from 'expo-router';
import { ChevronRight, HeartHandshake, ShieldCheck, UserRound, UsersRound } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EligibleUserPicker } from '../../src/features/operations/components/EligibleUserPicker';
import { useCareGroups, useCreateCareGroup, useEligibleUsers } from '../../src/features/operations/hooks';
import { patientInitials } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

function FormStep({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 border-b border-vc-border-dark pb-5">
      <View className="flex-row items-start gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-vc-primary-dark">
          <Text className="text-sm font-bold text-vc-bg-dark">{number}</Text>
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-base font-bold text-vc-text-dark">{title}</Text>
          <Text className="text-xs leading-5 text-vc-text-muted-dark">{description}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function ManagerGroupsScreen() {
  const groups = useCareGroups();
  const patients = useEligibleUsers('PATIENT');
  const caregivers = useEligibleUsers('CAREGIVER');
  const responsibles = useEligibleUsers('RESPONSIBLE');
  const createGroup = useCreateCareGroup();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [caregiverIds, setCaregiverIds] = useState<string[]>([]);
  const [responsibleIds, setResponsibleIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string>();
  const [groupSearch, setGroupSearch] = useState('');
  const [groupStatus, setGroupStatus] = useState('ALL');

  const patientMap = useMemo(
    () => Object.fromEntries((patients.data ?? []).map((u) => [u.id, u.name])),
    [patients.data],
  );

  const groupItems = groups.data ?? [];
  const filteredGroups = groupItems.filter((group) => {
    const matchesStatus = groupStatus === 'ALL' || group.status === groupStatus;

    return matchesStatus && matchesFilterSearch(groupSearch, [
      group.name,
      group.status === 'ACTIVE' ? 'Ativo' : 'Inativo',
      ...group.patientIds.map((id) => patientMap[id] ?? id),
      ...group.caregiverIds,
      ...group.responsibleIds,
    ]);
  });
  const groupFilterOptions = [
    { label: 'Todos', value: 'ALL', count: groupItems.length },
    { label: 'Ativos', value: 'ACTIVE', count: groupItems.filter((group) => group.status === 'ACTIVE').length },
    { label: 'Inativos', value: 'INACTIVE', count: groupItems.filter((group) => group.status === 'INACTIVE').length },
  ];

  function save() {
    setFormError(undefined);
    if (!name.trim()) {
      setFormError('Informe um nome para o grupo.');
      return;
    }
    if (!patientIds.length) {
      setFormError('Selecione ao menos um paciente para criar o grupo.');
      return;
    }

    createGroup.mutate(
      { name: name.trim(), patientIds, caregiverIds, responsibleIds },
      {
        onSuccess: () => {
          setModalOpen(false);
          setName('');
          setPatientIds([]);
          setCaregiverIds([]);
          setResponsibleIds([]);
        },
      },
    );
  }

  return (
    <Screen action={<Button label="Novo grupo" onPress={() => setModalOpen(true)} variant="secondary" />} title="Grupos de cuidado" subtitle="Organize pacientes e as pessoas autorizadas a acompanhá-los.">
      {groups.isFetching && <ActivityIndicator color={colors.secondary} />}
      <ListFilters
        onOptionChange={setGroupStatus}
        onSearchChange={setGroupSearch}
        options={groupFilterOptions}
        placeholder="Buscar por grupo, paciente ou pessoa vinculada"
        resultCount={filteredGroups.length}
        search={groupSearch}
        selectedOption={groupStatus}
      />
      {filteredGroups.map((group) => (
        <Link asChild href={{ pathname: '/(manager)/group-detail', params: { id: group._id } }} key={group._id}>
          <Card className="gap-3 active:opacity-80">
            <View className="flex-row items-center justify-between">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-vc-surface-raised-dark">
                <UsersRound color={colors.secondary} size={21} />
              </View>
              <StatusBadge label={group.status === 'ACTIVE' ? 'Ativo' : 'Inativo'} tone={group.status === 'ACTIVE' ? 'success' : 'danger'} />
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-base font-bold text-vc-text-dark">{group.name}</Text>
                <Text className="text-xs text-vc-text-muted-dark">{group.patientIds.length ? `Pacientes: ${group.patientIds.map((id) => patientMap[id] ?? '...').join(', ')}` : 'Nenhum paciente vinculado'}</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-xl bg-vc-bg-dark p-3">
                <Text className="text-lg font-bold text-vc-primary-dark">{group.caregiverIds.length}</Text>
                <Text className="text-xs text-vc-text-muted-dark">Cuidadores</Text>
              </View>
              <View className="flex-1 rounded-xl bg-vc-bg-dark p-3">
                <Text className="text-lg font-bold text-vc-secondary-dark">{group.responsibleIds.length}</Text>
                <Text className="text-xs text-vc-text-muted-dark">Responsáveis</Text>
              </View>
            </View>
          </Card>
        </Link>
      ))}
      {!groups.isFetching && !filteredGroups.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhum grupo encontrado para os filtros.</Text></Card>}
      <ModalSheet footer={<Button disabled={!name.trim() || !patientIds.length} label="Criar grupo" loading={createGroup.isPending} onPress={save} />} onClose={() => setModalOpen(false)} subtitle="Defina quem recebe cuidado e quem pode acompanhar o grupo." title="Novo grupo" visible={modalOpen}>
        <FormStep description="Use um nome fácil de reconhecer na rotina." number="1" title="Identifique o grupo">
          <Input label="Nome do grupo *" onChangeText={setName} placeholder="Ex.: Cuidados da família Lima" value={name} />
        </FormStep>
        <FormStep description="Estas são as pessoas que receberão os cuidados deste grupo." number="2" title="Escolha os pacientes">
          {patients.isFetching && <ActivityIndicator color={colors.secondary} size="small" />}
          {patients.error && <Text className="text-xs text-vc-danger-dark">{patients.error.message}</Text>}
          <EligibleUserPicker description="Obrigatório para criar o grupo." emptyMessage="Nenhum paciente elegível encontrado." label="Pacientes" multiple onChange={setPatientIds} required selectedIds={patientIds} users={patients.data ?? []} />
        </FormStep>
        <FormStep description="Podem receber atribuições e realizar atendimentos." number="3" title="Adicione cuidadores">
          {caregivers.isFetching && <ActivityIndicator color={colors.secondary} size="small" />}
          {caregivers.error && <Text className="text-xs text-vc-danger-dark">{caregivers.error.message}</Text>}
          <EligibleUserPicker description="Opcional. Você pode adicionar depois." emptyMessage="Nenhum cuidador elegível encontrado." label="Cuidadores" multiple onChange={setCaregiverIds} selectedIds={caregiverIds} users={caregivers.data ?? []} />
        </FormStep>
        <FormStep description="Acompanham informações dos pacientes em modo de leitura." number="4" title="Adicione responsáveis">
          {responsibles.isFetching && <ActivityIndicator color={colors.secondary} size="small" />}
          {responsibles.error && <Text className="text-xs text-vc-danger-dark">{responsibles.error.message}</Text>}
          <EligibleUserPicker description="Opcional. Você pode adicionar depois." emptyMessage="Nenhum responsável elegível encontrado." label="Responsáveis" multiple onChange={setResponsibleIds} selectedIds={responsibleIds} users={responsibles.data ?? []} />
        </FormStep>
        <View className="gap-3 rounded-xl bg-vc-surface-raised-dark p-4">
          <Text className="text-sm font-bold text-vc-text-dark">Resumo do novo grupo</Text>
          <View className="flex-row items-center gap-2"><UserRound color={colors.primary} size={16} /><Text className="text-xs text-vc-text-muted-dark">{patientIds.length} paciente(s)</Text></View>
          <View className="flex-row items-center gap-2"><HeartHandshake color={colors.secondary} size={16} /><Text className="text-xs text-vc-text-muted-dark">{caregiverIds.length} cuidador(es)</Text></View>
          <View className="flex-row items-center gap-2"><ShieldCheck color={colors.warning} size={16} /><Text className="text-xs text-vc-text-muted-dark">{responsibleIds.length} responsável(is)</Text></View>
        </View>
        {formError && <Text className="text-xs text-vc-danger-dark">{formError}</Text>}
        {createGroup.error && <Text className="text-xs text-vc-danger-dark">{createGroup.error.message}</Text>}
      </ModalSheet>
    </Screen>
  );
}
