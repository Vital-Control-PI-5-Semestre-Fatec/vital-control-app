import { Link } from 'expo-router';
import { AlertCircle, ChevronRight, ClipboardList, Clock3 } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisits } from '../../src/features/operations/hooks';
import { patientInitials, visitStatusLabel, visitStatusTone, visitTimeRange, visitWindow } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';

export default function ManagerRequestsScreen() {
  const visits = useOperationalVisits();
  const requested = (visits.data ?? [])
    .filter((visit) => visit.status === 'REQUESTED' || visit.status === 'TRIAGED')
    .sort((left, right) => new Date(visitWindow(left).start).getTime() - new Date(visitWindow(right).start).getTime());

  return (
    <Screen title="Triagem" subtitle="Todas as solicitações aguardando grupo, cuidador e horário.">
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      {visits.error && <Text className="text-sm text-vc-danger-dark">{visits.error.message}</Text>}
      {requested.map((visit) => (
        <Link asChild href={{ pathname: '/(manager)/visit-detail', params: { id: visit._id } }} key={visit._id}>
          <Pressable className="active:opacity-80">
            <View className="gap-3 rounded-2xl border border-vc-danger-dark bg-vc-danger-dark/90 p-4">
              <View className="flex-row items-center justify-between">
                <AlertCircle color={colors.background} size={22} />
                <StatusBadge label={visitStatusLabel[visit.status]} tone={visitStatusTone(visit.status)} />
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-vc-text-dark">
                  <Text className="text-base font-bold text-vc-danger-dark">{patientInitials(visit.patientId)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-vc-bg-dark">Atribuir atendimento</Text>
                  <Text className="text-xs text-vc-bg-dark">Paciente {patientInitials(visit.patientId)} | {visit.reason}</Text>
                </View>
                <ChevronRight color={colors.background} size={22} />
              </View>
              <View className="flex-row items-center gap-1.5">
                <Clock3 color={colors.background} size={15} />
                <Text className="flex-1 text-xs text-vc-bg-dark">
                  {new Date(visitWindow(visit).start).toLocaleDateString('pt-BR')} | {visitTimeRange(visit)} | {visit.addressSnapshot.city}/{visit.addressSnapshot.state}
                </Text>
              </View>
            </View>
          </Pressable>
        </Link>
      ))}
      {!visits.isFetching && !requested.length && (
        <View className="items-center gap-3 rounded-2xl border border-dashed border-vc-border-dark bg-vc-surface-dark p-6">
          <ClipboardList color={colors.textMuted} size={28} />
          <Text className="text-center text-sm text-vc-text-muted-dark">Nenhuma solicitação pendente.</Text>
        </View>
      )}
    </Screen>
  );
}
