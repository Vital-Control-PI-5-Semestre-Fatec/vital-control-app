import { Link } from 'expo-router';
import { CalendarDays, Clock3, UsersRound } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { DateNavigator } from '../../src/components/ui/DateNavigator';
import { useEligibleUsers, useOperationalVisits } from '../../src/features/operations/hooks';
import { dateKeyFromDate, patientInitials, visitDateKey, visitStatusLabel, visitStatusTone, visitTimeRange, visitWindow } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';
import { cn } from '../../src/utils/cn';
import { matchesFilterSearch } from '../../src/utils/list-filters';

export default function ManagerAgendaScreen() {
  const visits = useOperationalVisits();
  const patients = useEligibleUsers('PATIENT');
  const patientMap = useMemo(
    () => Object.fromEntries((patients.data ?? []).map((u) => [u.id, u.name])),
    [patients.data],
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaStatus, setAgendaStatus] = useState('ALL');
  const selectedDateKey = dateKeyFromDate(selectedDate);
  const visitsOfDay = [...(visits.data ?? [])]
    .filter((visit) => visitDateKey(visit) === selectedDateKey)
    .sort((left, right) => new Date(visitWindow(left).start).getTime() - new Date(visitWindow(right).start).getTime());
  const filteredVisitsOfDay = visitsOfDay.filter((visit) => {
    const needsTriage = visit.status === 'REQUESTED' || visit.status === 'TRIAGED';
    const matchesStatus =
      agendaStatus === 'ALL' ||
      visit.status === agendaStatus ||
      (agendaStatus === 'TRIAGE' && needsTriage);

    return matchesStatus && matchesFilterSearch(agendaSearch, [
      patientMap[visit.patientId ?? ''] ?? visit.patientId,
      visit.reason,
      visitStatusLabel[visit.status],
      visit.assignedCaregiverId,
      visit.addressSnapshot.city,
      visit.addressSnapshot.state,
    ]);
  });
  const agendaFilterOptions = [
    { label: 'Todos', value: 'ALL', count: visitsOfDay.length },
    { label: 'Triagem', value: 'TRIAGE', count: visitsOfDay.filter((visit) => visit.status === 'REQUESTED' || visit.status === 'TRIAGED').length },
    { label: 'Agendados', value: 'SCHEDULED', count: visitsOfDay.filter((visit) => visit.status === 'SCHEDULED').length },
    { label: 'Em andamento', value: 'IN_PROGRESS', count: visitsOfDay.filter((visit) => visit.status === 'IN_PROGRESS').length },
    { label: 'Concluidos', value: 'COMPLETED', count: visitsOfDay.filter((visit) => visit.status === 'COMPLETED').length },
  ];

  return (
    <Screen scroll title="Home" subtitle="Agenda operacional por data.">
      <View className="rounded-2xl bg-vc-bg-dark">
        <DateNavigator onChange={setSelectedDate} selectedDate={selectedDate} />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-vc-text-dark">Atendimentos do dia</Text>
        <Text className="text-xs font-semibold text-vc-text-muted-dark">{filteredVisitsOfDay.length} item(ns)</Text>
      </View>
      <ListFilters
        onOptionChange={setAgendaStatus}
        onSearchChange={setAgendaSearch}
        options={agendaFilterOptions}
        placeholder="Buscar por paciente, cuidador ou cidade"
        resultCount={filteredVisitsOfDay.length}
        search={agendaSearch}
        selectedOption={agendaStatus}
      />
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      <View className="gap-3">
        {filteredVisitsOfDay.map((visit) => {
          const needsTriage = visit.status === 'REQUESTED' || visit.status === 'TRIAGED';
          const content = (
            <Pressable className="active:opacity-80">
              <View className={cn('gap-3 rounded-2xl border p-4', needsTriage ? 'border-vc-danger-dark bg-vc-danger-dark/90' : 'border-vc-border-dark bg-vc-surface-dark')}>
              <View className="flex-row items-center gap-3">
                <View className={cn('h-14 w-14 items-center justify-center rounded-2xl', needsTriage ? 'bg-vc-text-dark' : 'bg-vc-primary-dark')}>
                  <Text className={cn('text-base font-bold', needsTriage ? 'text-vc-danger-dark' : 'text-vc-bg-dark')}>{((n) => { const p = n.trim().split(/\s+/); return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : n.slice(0,2).toUpperCase(); })(patientMap[visit.patientId ?? ''] ?? '?')}</Text>
                </View>
                <View className="flex-1">
                  <Text className={cn('text-base font-bold', needsTriage ? 'text-vc-bg-dark' : 'text-vc-text-dark')}>{needsTriage ? 'Solicitação pendente' : (patientMap[visit.patientId ?? ''] ?? 'Paciente')}</Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    <Clock3 color={needsTriage ? colors.background : colors.textMuted} size={14} />
                    <Text className={cn('text-xs', needsTriage ? 'text-vc-bg-dark' : 'text-vc-text-muted-dark')}>{needsTriage ? 'Solicitação aguardando triagem' : visitTimeRange(visit)}</Text>
                  </View>
                </View>
                <StatusBadge label={visitStatusLabel[visit.status]} tone={visitStatusTone(visit.status)} />
              </View>
              <View className="flex-row items-center gap-1.5">
                <UsersRound color={needsTriage ? colors.background : colors.textMuted} size={15} />
                <Text className={cn('flex-1 text-xs', needsTriage ? 'text-vc-bg-dark' : 'text-vc-text-muted-dark')}>Cuidador {visit.assignedCaregiverId ?? 'não atribuído'}</Text>
              </View>
              </View>
            </Pressable>
          );

          if (needsTriage) {
            return (
              <Link asChild href="/(manager)/requests" key={visit._id}>
                {content}
              </Link>
            );
          }

          return <View key={visit._id}>{content}</View>;
        })}
        {!visits.isFetching && !filteredVisitsOfDay.length && (
          <View className="items-center gap-3 rounded-2xl border border-dashed border-vc-border-dark bg-vc-surface-dark p-6">
            <CalendarDays color={colors.textMuted} size={28} />
            <Text className="text-center text-sm text-vc-text-muted-dark">Nenhum atendimento nesta data.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
