import { ActivityIndicator, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Repeat2, Users } from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAuth } from '../../src/providers/AuthProvider';
import { patientApi } from '../../src/features/patient/api';
import { operationsApi } from '../../src/features/operations/api';
import { colors } from '../../src/theme/colors';
import type { ApiSchedule } from '../../src/features/patient/api-types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const careGroupsQuery = useQuery({
    queryKey: ['responsible', 'care-groups', session?.user.id],
    queryFn: async () => {
      const allGroups = await operationsApi.getCareGroups(session!.accessToken);
      return allGroups.filter((g) => g.responsibleIds.includes(session!.user.id));
    },
    enabled: !!session,
  });

  const patientId = careGroupsQuery.data?.[0]?.patientIds[0] ?? null;

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

      {(schedulesQuery.data ?? []).map((schedule) => {
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
                  Dose: {schedule.dose.quantity} {schedule.dose.unit}
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

      {!isLoading && schedulesQuery.data?.length === 0 && patientId && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Repeat2 color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhuma rotina cadastrada.
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}