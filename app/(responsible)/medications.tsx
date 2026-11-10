import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Users, Pill } from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAuth } from '../../src/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '../../src/features/patient/api';
import { operationsApi } from '../../src/features/operations/api';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

function formatUnit(unit?: string) {
  const units: Record<string, string> = {
    TABLET: 'Comprimido',
    CAPSULE: 'Cápsula',
    DROP: 'Gota',
    ML: 'mL',
    MG: 'mg',
    UNIT: 'Unidade',
  };
  return units[unit ?? ''] ?? unit ?? '';
}

export default function ResponsibleMedicationsScreen() {
  const { session } = useAuth();
  const [medicationSearch, setMedicationSearch] = useState('');
  const [medicationStatus, setMedicationStatus] = useState('ALL');

  const careGroupsQuery = useQuery({
    queryKey: ['responsible', 'care-groups', session?.user.id],
    queryFn: async () => {
      const allGroups = await operationsApi.getCareGroups(session!.accessToken);
      return allGroups.filter((g) => g.responsibleIds.includes(session!.user.id));
    },
    enabled: !!session,
  });

  const patientId = careGroupsQuery.data?.[0]?.patientIds[0] ?? null;

  const medicationsQuery = useQuery({
    queryKey: ['responsible', 'medications', patientId],
    queryFn: () => patientApi.getMedications(patientId!, session!.accessToken),
    enabled: !!patientId && !!session,
  });

  const isLoading = careGroupsQuery.isLoading || medicationsQuery.isLoading;
  const medicationItems = medicationsQuery.data ?? [];
  const filteredMedications = medicationItems.filter((medication) => {
    const isActive = medication.active !== false;
    const lowStock =
      medication.stock.lowStockThreshold !== undefined &&
      medication.stock.currentQuantity <= medication.stock.lowStockThreshold;
    const matchesStatus =
      medicationStatus === 'ALL' ||
      (medicationStatus === 'ACTIVE' && isActive) ||
      (medicationStatus === 'INACTIVE' && !isActive) ||
      (medicationStatus === 'LOW_STOCK' && lowStock);

    return matchesStatus && matchesFilterSearch(medicationSearch, [
      medication.name,
      medication.dosageDescription,
      medication.brand,
      medication.notes,
      medication.barcode,
      formatUnit(medication.stock.unit),
    ]);
  });
  const medicationFilterOptions = [
    { label: 'Todos', value: 'ALL', count: medicationItems.length },
    { label: 'Ativos', value: 'ACTIVE', count: medicationItems.filter((item) => item.active !== false).length },
    { label: 'Estoque baixo', value: 'LOW_STOCK', count: medicationItems.filter((item) => item.stock.lowStockThreshold !== undefined && item.stock.currentQuantity <= item.stock.lowStockThreshold).length },
    { label: 'Inativos', value: 'INACTIVE', count: medicationItems.filter((item) => item.active === false).length },
  ];

  return (
    <Screen title="Medicamentos" subtitle="Visualização somente leitura dos medicamentos do paciente.">
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

      {!!patientId && (
        <ListFilters
          onOptionChange={setMedicationStatus}
          onSearchChange={setMedicationSearch}
          options={medicationFilterOptions}
          placeholder="Buscar por nome, dose, marca ou codigo"
          resultCount={filteredMedications.length}
          search={medicationSearch}
          selectedOption={medicationStatus}
        />
      )}

      {filteredMedications.map((med) => {
        const isActive = med.active !== false;
        const lowStock =
          med.stock.lowStockThreshold !== undefined &&
          med.stock.currentQuantity <= med.stock.lowStockThreshold;

        return (
          <Card className={isActive ? 'gap-2' : 'gap-2 opacity-60'} key={med._id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-bold text-vc-text-dark">{med.name}</Text>
                <Text className="text-sm text-vc-text-muted-dark">{med.dosageDescription}</Text>
                {!!med.brand && (
                  <Text className="text-xs text-vc-text-muted-dark">Marca: {med.brand}</Text>
                )}
                {!!med.notes && (
                  <Text className="text-xs text-vc-text-muted-dark">Obs: {med.notes}</Text>
                )}
              </View>
              <View className="items-end gap-1.5">
                <StatusBadge
                  label={`${med.stock.currentQuantity} ${formatUnit(med.stock.unit)}`}
                  tone={lowStock ? 'warning' : 'success'}
                />
                <StatusBadge
                  label={isActive ? 'Ativo' : 'Inativo'}
                  tone={isActive ? 'success' : 'warning'}
                />
              </View>
            </View>
            {lowStock && isActive && (
              <Text className="text-xs font-semibold text-vc-warning-dark">
                ⚠️ Estoque abaixo do limite configurado.
              </Text>
            )}
          </Card>
        );
      })}

      {!isLoading && filteredMedications.length === 0 && patientId && (
        <Card>
          <View className="flex-row items-center gap-4 py-2">
            <Pill color={colors.textMuted} size={28} />
            <Text className="text-sm text-vc-text-muted-dark flex-1">
              Nenhum medicamento cadastrado.
            </Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}
