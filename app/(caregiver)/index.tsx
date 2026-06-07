import { Link } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { DateNavigator } from '../../src/components/ui/DateNavigator';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisits } from '../../src/features/operations/hooks';
import { dateKeyFromDate, patientInitials, visitDateKey, visitStatusLabel, visitStatusTone, visitTimeRange, visitWindow } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

export default function CaregiverAgendaScreen() {
  const visits = useOperationalVisits();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaStatus, setAgendaStatus] = useState('ALL');
  const selectedDateKey = dateKeyFromDate(selectedDate);
  const agenda = (visits.data ?? [])
    .filter((visit) => !['REQUESTED', 'TRIAGED'].includes(visit.status))
    .filter((visit) => visitDateKey(visit) === selectedDateKey)
    .sort((left, right) => new Date(visitWindow(left).start).getTime() - new Date(visitWindow(right).start).getTime());
  const filteredAgenda = agenda.filter((visit) => {
    const matchesStatus = agendaStatus === 'ALL' || visit.status === agendaStatus;

    return matchesStatus && matchesFilterSearch(agendaSearch, [
      patientInitials(visit.patientId),
      visit.patientId,
      visit.reason,
      visitStatusLabel[visit.status],
      visit.addressSnapshot.street,
      visit.addressSnapshot.city,
      visit.addressSnapshot.state,
      visit.caregiverNotes,
    ]);
  });
  const agendaFilterOptions = [
    { label: 'Todos', value: 'ALL', count: agenda.length },
    { label: 'Agendados', value: 'SCHEDULED', count: agenda.filter((visit) => visit.status === 'SCHEDULED').length },
    { label: 'Em andamento', value: 'IN_PROGRESS', count: agenda.filter((visit) => visit.status === 'IN_PROGRESS').length },
    { label: 'Concluidos', value: 'COMPLETED', count: agenda.filter((visit) => visit.status === 'COMPLETED').length },
    { label: 'Ausencia', value: 'NO_SHOW', count: agenda.filter((visit) => visit.status === 'NO_SHOW').length },
  ];

  return (
    <Screen title="Agenda" subtitle="Atendimentos agendados e histórico por dia.">
      <DateNavigator label="Dia da agenda" onChange={setSelectedDate} selectedDate={selectedDate} />
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-vc-text-dark">Atendimentos do dia</Text>
        <Text className="text-xs font-semibold text-vc-text-muted-dark">{filteredAgenda.length} item(ns)</Text>
      </View>
      <ListFilters
        onOptionChange={setAgendaStatus}
        onSearchChange={setAgendaSearch}
        options={agendaFilterOptions}
        placeholder="Buscar por paciente, endereco ou status"
        resultCount={filteredAgenda.length}
        search={agendaSearch}
        selectedOption={agendaStatus}
      />
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      {visits.error && <Text className="text-sm text-vc-danger-dark">{visits.error.message}</Text>}
      {filteredAgenda.map((visit) => (
        <Link asChild href={{ pathname: '/(caregiver)/visit-detail', params: { id: visit._id } }} key={visit._id}>
          <Card className="gap-3 active:opacity-80">
            <View className="flex-row items-center justify-between gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-vc-surface-raised-dark">
                <CalendarDays color={colors.secondary} size={22} />
              </View>
              <StatusBadge label={visitStatusLabel[visit.status]} tone={visitStatusTone(visit.status)} />
            </View>
            <View className="gap-1">
              <Text className="text-base font-bold text-vc-text-dark">Paciente {patientInitials(visit.patientId)}</Text>
              <Text className="text-sm font-semibold text-vc-primary-dark">{visitTimeRange(visit)}</Text>
              <Text className="text-xs text-vc-text-muted-dark">ID operacional: {visit.patientId}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <MapPin color={colors.textMuted} size={15} />
              <Text className="flex-1 text-xs text-vc-text-muted-dark">{visit.addressSnapshot.street}, {visit.addressSnapshot.number} - {visit.addressSnapshot.city}</Text>
            </View>
          </Card>
        </Link>
      ))}
      {!visits.isFetching && !filteredAgenda.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhum atendimento encontrado para os filtros.</Text></Card>}
    </Screen>
  );
}
