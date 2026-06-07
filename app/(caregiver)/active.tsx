import { Link } from 'expo-router';
import { Clock3, NotebookPen } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisits } from '../../src/features/operations/hooks';
import { formatVisitWindow, patientInitials, visitStatusLabel, visitStatusTone } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';
import { useState } from 'react';

export default function CaregiverActiveVisitsScreen() {
  const visits = useOperationalVisits();
  const [activeSearch, setActiveSearch] = useState('');
  const activeVisits = (visits.data ?? []).filter((visit) => visit.status === 'IN_PROGRESS');
  const filteredActiveVisits = activeVisits.filter((visit) =>
    matchesFilterSearch(activeSearch, [
      patientInitials(visit.patientId),
      visit.patientId,
      visit.reason,
      visit.caregiverNotes,
      formatVisitWindow(visit),
      visit.addressSnapshot.city,
      visit.addressSnapshot.state,
    ]),
  );

  return (
    <Screen title="Em andamento" subtitle="Atendimentos iniciados que ainda precisam de fechamento.">
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      <ListFilters
        onSearchChange={setActiveSearch}
        placeholder="Buscar por paciente, horario ou anotacao"
        resultCount={filteredActiveVisits.length}
        search={activeSearch}
      />
      {filteredActiveVisits.map((visit) => (
        <Link asChild href={{ pathname: '/(caregiver)/visit-detail', params: { id: visit._id } }} key={visit._id}>
          <Card className="gap-3 active:opacity-80">
            <View className="flex-row items-center justify-between">
              <Clock3 color={colors.secondary} size={22} />
              <StatusBadge label={visitStatusLabel[visit.status]} tone={visitStatusTone(visit.status)} />
            </View>
            <Text className="text-base font-bold text-vc-text-dark">Paciente {patientInitials(visit.patientId)}</Text>
            <Text className="text-sm font-semibold text-vc-primary-dark">{formatVisitWindow(visit)}</Text>
            <View className="flex-row gap-2">
              <NotebookPen color={colors.textMuted} size={16} />
              <Text className="flex-1 text-xs text-vc-text-muted-dark">{visit.caregiverNotes || 'Sem observacoes registradas pelo cuidador.'}</Text>
            </View>
          </Card>
        </Link>
      ))}
      {!visits.isFetching && !filteredActiveVisits.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhuma visita em andamento encontrada para os filtros.</Text></Card>}
    </Screen>
  );
}
