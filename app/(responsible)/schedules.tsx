import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Repeat2, User, Users } from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAuth } from '../../src/providers/AuthProvider';
import { useActivePatient } from '../../src/providers/ResponsibleActivePatientProvider';
import { patientApi } from '../../src/features/patient/api';
import { operationsApi } from '../../src/features/operations/api';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';
import type { ApiSchedule } from '../../src/features/patient/api-types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DOSE_UNIT_LABELS: Record<string, string> = {
  TABLET: 'Comprimido',
  CAPSULE: 'Cápsula',
  DROP: 'Gota',
  ML: 'mL',
};

function formatDoseUnit(unit?: string) {
  return (unit && DOSE_UNIT_LABELS[unit]) ? DOSE_UNIT_LABELS[unit] : (unit ?? '');
}

function formatRecurrence(schedule: ApiSchedule) {
  if (schedule.recurrence.type === 'DAILY') return 'Diária';
  if (schedule.recurrence.type === 'WEEKDAYS') {
    const labels = (schedule.recurrence.weekdays ?? [])
      .map((d) => WEEKDAYS[d])
      .filter(Boolean)
      .join(', ');
    return labels ? `Dias: ${labels}` : 'Dias da semana';
  }
  return `A cada ${schedule.recurrence.intervalDays ?? 1} dia(s)`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

export default function ResponsibleSchedulesScreen() {
  const { session } = useAuth();
  const { activePatientId, setActivePatientId } = useActivePatient();
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('ALL');

  const careGroupsQuery = useQuery({
    queryKey: ['responsible', 'care-groups', session?.user.id],
    queryFn: async () => {
      const allGroups = await operationsApi.getCareGroups(session!.accessToken);
      return allGroups;
    },
    enabled: !!session,
  });

  const eligiblePatientsQuery = useQuery({
    queryKey: ['eligible-users', 'PATIENT'],
    queryFn: () => operationsApi.getEligibleUsers('PATIENT', session!.accessToken),
    enabled: !!session,
  });

  const patientNameMap = Object.fromEntries(
    (eligiblePatientsQuery.data ?? []).map((u) => [u.id, u.name])
  );

  const patientIds = [...(careGroupsQuery.data?.flatMap((g) => g.patientIds) ?? [])].sort();
  const patientId = activePatientId || patientIds[0] || null;

  const schedulesQuery = useQuery({
    queryKey: ['responsible', 'schedules', patientId],
    queryFn: () => patientApi.getSchedules(patientId!, session!.accessToken),
    enabled: !!patientId && !!session,
  });

  const medicationsQuery = useQuery({
    queryKey: ['responsible', 'medications', patientId],
    queryFn: () => patientApi.getMedications(patientId!, session!.accessToken),
    enabled: !!patientId && !!session,
  });

  const isLoading = careGroupsQuery.isLoading || schedulesQuery.isLoading;
  const scheduleItems = schedulesQuery.data ?? [];
  const filteredSchedules = scheduleItems.filter((schedule) => {
    const isActive = schedule.active !== false;
    const matchesStatus =
      scheduleStatus === 'ALL' ||
      (scheduleStatus === 'ACTIVE' && isActive) ||
      (scheduleStatus === 'INACTIVE' && !isActive) ||
      (scheduleStatus === 'DAILY' && schedule.recurrence.type === 'DAILY') ||
      (scheduleStatus === 'WEEKDAYS' && schedule.recurrence.type === 'WEEKDAYS') ||
      (scheduleStatus === 'INTERVAL_DAYS' && schedule.recurrence.type === 'INTERVAL_DAYS');

    const medication = medicationsQuery.data?.find((m) => m._id === schedule.medicationId);

    return matchesStatus && matchesFilterSearch(scheduleSearch, [
      schedule.title,
      medication?.name,
      schedule.instructions,
      ...schedule.times,
    ]);
  });
  const scheduleFilterOptions = [
    { label: 'Todas', value: 'ALL', count: scheduleItems.length },
    { label: 'Ativas', value: 'ACTIVE', count: scheduleItems.filter((item) => item.active !== false).length },
    { label: 'Inativas', value: 'INACTIVE', count: scheduleItems.filter((item) => item.active === false).length },
    { label: 'Diárias', value: 'DAILY', count: scheduleItems.filter((item) => item.recurrence.type === 'DAILY').length },
    { label: 'Semana', value: 'WEEKDAYS', count: scheduleItems.filter((item) => item.recurrence.type === 'WEEKDAYS').length },
    { label: 'Intervalo', value: 'INTERVAL_DAYS', count: scheduleItems.filter((item) => item.recurrence.type === 'INTERVAL_DAYS').length },
  ];

  return (
    <Screen title="Rotinas" subtitle="Visualização somente leitura das rotinas do paciente.">
      {isLoading && <ActivityIndicator color={colors.secondary} />}

      {!isLoading && !patientId && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Users color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhum paciente vinculado à sua conta ainda.
            </Text>
          </View>
        </Card>
      )}

      {patientIds.length > 1 && (
        <View className="flex-row flex-wrap gap-2">
          {patientIds.map((pId) => {
            const isSelected = patientId === pId;
            return (
              <Pressable
                key={pId}
                onPress={() => setActivePatientId(pId)}
                className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border ${isSelected ? 'border-vc-secondary-dark bg-vc-surface-raised-dark' : 'border-vc-border-dark bg-vc-surface-dark'}`}
              >
                <User color={isSelected ? colors.secondary : colors.textMuted} size={15} />
                <Text className={`text-xs font-bold ${isSelected ? 'text-vc-secondary-dark' : 'text-vc-text-muted-dark'}`}>
                  {patientNameMap[pId] ?? 'Paciente'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!patientId && !!scheduleItems.length && (
        <ListFilters
          onOptionChange={setScheduleStatus}
          onSearchChange={setScheduleSearch}
          options={scheduleFilterOptions}
          placeholder="Buscar por rotina, medicamento ou horário"
          resultCount={filteredSchedules.length}
          search={scheduleSearch}
          selectedOption={scheduleStatus}
        />
      )}

      {filteredSchedules.map((schedule) => {
        const isActive = schedule.active !== false;
        const medication = medicationsQuery.data?.find((m) => m._id === schedule.medicationId);

        return (
          <Card className={isActive ? 'gap-3' : 'gap-3 opacity-60'} key={schedule._id}>
            <View className="flex-row gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-vc-surface-raised-dark">
                <Repeat2 color={colors.secondary} size={19} />
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-vc-text-dark">{schedule.title}</Text>
                    {!!medication && (
                      <Text className="text-xs text-vc-text-muted-dark">
                        Medicamento: {medication.name}
                      </Text>
                    )}
                  </View>
                  <StatusBadge
                    label={isActive ? 'Ativa' : 'Inativa'}
                    tone={isActive ? 'success' : 'warning'}
                  />
                </View>
                <Text className="text-sm text-vc-text-muted-dark">
                  Dose: {schedule.dose.quantity} {formatDoseUnit(schedule.dose.unit)}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <Clock3 color={colors.primary} size={14} />
                  <Text className="text-xs font-semibold text-vc-primary-dark">
                    {schedule.times.join(', ')}
                  </Text>
                </View>
                <Text className="text-xs text-vc-text-muted-dark">
                  {formatRecurrence(schedule)}
                </Text>
                <Text className="text-xs text-vc-text-muted-dark">
                  Início: {formatDate(schedule.startDate)}
                  {schedule.endDate ? ` | Fim: ${formatDate(schedule.endDate)}` : ''}
                </Text>
                {!!schedule.instructions && (
                  <Text className="text-xs text-vc-text-muted-dark">
                    Instruções: {schedule.instructions}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        );
      })}

      {!isLoading && !scheduleItems.length && patientId && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Repeat2 color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhuma rotina cadastrada.
            </Text>
          </View>
        </Card>
      )}

      {!isLoading && !!scheduleItems.length && !filteredSchedules.length && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Repeat2 color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhuma rotina encontrada com esse filtro.
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}