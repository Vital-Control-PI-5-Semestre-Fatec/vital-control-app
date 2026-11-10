import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users } from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAuth } from '../../src/providers/AuthProvider';
import { patientApi } from '../../src/features/patient/api';
import { colors } from '../../src/theme/colors';
import type { ApiHomeVisit } from '../../src/features/patient/api-types';
import { matchesFilterSearch } from '../../src/utils/list-filters';

const STATUS_LABEL: Record<ApiHomeVisit['status'], string> = {
  REQUESTED: 'Solicitado',
  TRIAGED: 'Em triagem',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

const STATUS_TONE: Record<ApiHomeVisit['status'], 'info' | 'warning' | 'success' | 'danger'> = {
  REQUESTED: 'info',
  TRIAGED: 'info',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

function formatDate(iso?: string) {
  if (!iso) return 'Data não informada';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ResponsibleVisitsScreen() {
  const { session } = useAuth();
  const [visitSearch, setVisitSearch] = useState('');
  const [visitStatus, setVisitStatus] = useState('ALL');

  const visitsQuery = useQuery({
    queryKey: ['responsible', 'visits'],
    queryFn: () => patientApi.getVisits(session!.accessToken),
    enabled: !!session,
  });
  const visitItems = visitsQuery.data ?? [];
  const filteredVisits = visitItems.filter((visit) => {
    const window = visit.scheduledWindow ?? visit.requestedWindow;
    const matchesStatus = visitStatus === 'ALL' || visit.status === visitStatus;

    return matchesStatus && matchesFilterSearch(visitSearch, [
      visit.reason,
      visit.patientNotes,
      STATUS_LABEL[visit.status],
      visit.addressSnapshot.street,
      visit.addressSnapshot.city,
      visit.addressSnapshot.state,
      new Date(window.start).toLocaleDateString('pt-BR'),
    ]);
  });
  const visitFilterOptions = [
    { label: 'Todos', value: 'ALL', count: visitItems.length },
    { label: 'Solicitados', value: 'REQUESTED', count: visitItems.filter((item) => item.status === 'REQUESTED').length },
    { label: 'Agendados', value: 'SCHEDULED', count: visitItems.filter((item) => item.status === 'SCHEDULED').length },
    { label: 'Em andamento', value: 'IN_PROGRESS', count: visitItems.filter((item) => item.status === 'IN_PROGRESS').length },
    { label: 'Concluidos', value: 'COMPLETED', count: visitItems.filter((item) => item.status === 'COMPLETED').length },
    { label: 'Cancelados', value: 'CANCELLED', count: visitItems.filter((item) => item.status === 'CANCELLED').length },
  ];

  return (
    <Screen title="Atendimentos" subtitle="Visualização somente leitura dos atendimentos.">
      {visitsQuery.isLoading && <ActivityIndicator color={colors.secondary} />}

      {visitsQuery.error && (
        <Card>
          <Text className="text-sm text-vc-danger-dark">Não foi possível carregar os atendimentos.</Text>
        </Card>
      )}

      <ListFilters
        onOptionChange={setVisitStatus}
        onSearchChange={setVisitSearch}
        options={visitFilterOptions}
        placeholder="Buscar por motivo, endereco, cidade ou status"
        resultCount={filteredVisits.length}
        search={visitSearch}
        selectedOption={visitStatus}
      />

      {filteredVisits.map((visit) => (
        <Card className="gap-3" key={visit._id}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-vc-surface-raised-dark">
              <Calendar color={colors.secondary} size={19} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-base font-bold text-vc-text-dark">{visit.reason}</Text>
              {!!visit.patientNotes && (
                <Text className="text-xs text-vc-text-muted-dark">Obs: {visit.patientNotes}</Text>
              )}
              <Text className="text-xs text-vc-text-muted-dark">
                Solicitado: {formatDate(visit.requestedWindow.start)}
              </Text>
              {visit.scheduledWindow && (
                <Text className="text-xs text-vc-text-muted-dark">
                  Agendado: {formatDate(visit.scheduledWindow.start)}
                </Text>
              )}
            </View>
            <StatusBadge
              label={STATUS_LABEL[visit.status]}
              tone={STATUS_TONE[visit.status]}
            />
          </View>
          <View className="gap-0.5 border-t border-vc-border-dark pt-2">
            <Text className="text-xs text-vc-text-muted-dark">
              {visit.addressSnapshot.street}, {visit.addressSnapshot.number}
              {visit.addressSnapshot.complement ? ` — ${visit.addressSnapshot.complement}` : ''}
            </Text>
            <Text className="text-xs text-vc-text-muted-dark">
              {visit.addressSnapshot.city} — {visit.addressSnapshot.state}
            </Text>
          </View>
        </Card>
      ))}

      {!visitsQuery.isLoading && !filteredVisits.length && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Calendar color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhum atendimento registrado.
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}
