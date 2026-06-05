import { Link } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { DateNavigator } from '../../src/components/ui/DateNavigator';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisits } from '../../src/features/operations/hooks';
import { dateKeyFromDate, patientInitials, visitDateKey, visitStatusLabel, visitStatusTone, visitTimeRange, visitWindow } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';

export default function CaregiverAgendaScreen() {
  const visits = useOperationalVisits();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateKey = dateKeyFromDate(selectedDate);
  const agenda = (visits.data ?? [])
    .filter((visit) => !['REQUESTED', 'TRIAGED'].includes(visit.status))
    .filter((visit) => visitDateKey(visit) === selectedDateKey)
    .sort((left, right) => new Date(visitWindow(left).start).getTime() - new Date(visitWindow(right).start).getTime());

  return (
    <Screen title="Agenda" subtitle="Atendimentos agendados e histórico por dia.">
      <DateNavigator label="Dia da agenda" onChange={setSelectedDate} selectedDate={selectedDate} />
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-vc-text-dark">Atendimentos do dia</Text>
        <Text className="text-xs font-semibold text-vc-text-muted-dark">{agenda.length} item(ns)</Text>
      </View>
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      {visits.error && <Text className="text-sm text-vc-danger-dark">{visits.error.message}</Text>}
      {agenda.map((visit) => (
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
      {!visits.isFetching && !agenda.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhum atendimento nesta data.</Text></Card>}
    </Screen>
  );
}
