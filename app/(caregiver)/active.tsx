import { Link } from 'expo-router';
import { Clock3, NotebookPen } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisits } from '../../src/features/operations/hooks';
import { formatVisitWindow, patientInitials, visitStatusLabel, visitStatusTone } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';

export default function CaregiverActiveVisitsScreen() {
  const visits = useOperationalVisits();
  const activeVisits = (visits.data ?? []).filter((visit) => visit.status === 'IN_PROGRESS');

  return (
    <Screen title="Em andamento" subtitle="Atendimentos iniciados que ainda precisam de fechamento.">
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      {activeVisits.map((visit) => (
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
      {!visits.isFetching && !activeVisits.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhuma visita em andamento.</Text></Card>}
    </Screen>
  );
}
