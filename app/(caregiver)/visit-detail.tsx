import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock3, Pill, UserRoundCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useOperationalVisit, useTakeVisitAdministration, useUpdateVisitStatus, useVisitMedicationContext } from '../../src/features/operations/hooks';
import { formatVisitWindow, patientInitials, visitStatusLabel, visitStatusTone } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';

export default function CaregiverVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const visit = useOperationalVisit(id);
  const [notes, setNotes] = useState('');
  const updateStatus = useUpdateVisitStatus();
  const medicationContext = useVisitMedicationContext(visit.data?.patientId);
  const takeAdministration = useTakeVisitAdministration(visit.data?.patientId);

  if (visit.isFetching && !visit.data) {
    return <Screen title="Visita"><ActivityIndicator color={colors.secondary} /></Screen>;
  }

  if (!visit.data) {
    return <Screen title="Visita"><Card><Text className="text-sm text-vc-text-muted-dark">Atendimento não encontrado.</Text></Card><Button label="Voltar" onPress={() => router.back()} variant="ghost" /></Screen>;
  }

  const canStart = visit.data.status === 'SCHEDULED';
  const canComplete = visit.data.status === 'IN_PROGRESS';
  const pendingAdministrations = medicationContext.data?.administrations.filter((item) => item.status === 'PENDING') ?? [];

  return (
    <Screen title="Detalhe da visita" subtitle={`Paciente ${patientInitials(visit.data.patientId)}`}>
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <UserRoundCheck color={colors.secondary} size={23} />
          <StatusBadge label={visitStatusLabel[visit.data.status]} tone={visitStatusTone(visit.data.status)} />
        </View>
        <Text className="text-base font-bold text-vc-text-dark">{visit.data.reason}</Text>
        <Text className="text-sm font-semibold text-vc-primary-dark">{formatVisitWindow(visit.data)}</Text>
        <Text className="text-xs leading-5 text-vc-text-muted-dark">{visit.data.addressSnapshot.street}, {visit.data.addressSnapshot.number} - {visit.data.addressSnapshot.city}/{visit.data.addressSnapshot.state}</Text>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Clock3 color={colors.secondary} size={18} />
          <Text className="text-base font-bold text-vc-text-dark">Observações do cuidador</Text>
        </View>
        <Input label="Registro da visita" multiline onChangeText={setNotes} placeholder="Ex.: paciente orientado, dose acompanhada..." value={notes} />
        {visit.data.caregiverNotes && <Text className="text-xs leading-5 text-vc-text-muted-dark">Ultimo registro: {visit.data.caregiverNotes}</Text>}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Pill color={colors.secondary} size={18} />
          <Text className="text-base font-bold text-vc-text-dark">Dose durante visita</Text>
        </View>
        {medicationContext.isFetching && <ActivityIndicator color={colors.secondary} />}
        {!pendingAdministrations.length && !medicationContext.isFetching && <Text className="text-sm text-vc-text-muted-dark">Nenhuma dose pendente encontrada para registro nesta visita.</Text>}
        {pendingAdministrations.map((administration) => (
          <View className="gap-2 rounded-xl border border-vc-border-dark p-3" key={administration._id}>
            <Text className="text-sm font-bold text-vc-text-dark">{administration.medicationSnapshot.name}</Text>
            <Text className="text-xs text-vc-text-muted-dark">{administration.medicationSnapshot.dosageDescription} - {new Date(administration.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            <Button disabled={!canComplete} label="Registrar dose tomada" loading={takeAdministration.isPending} onPress={() => takeAdministration.mutate({ administrationId: administration._id, notes })} variant="secondary" />
          </View>
        ))}
      </Card>

      {canStart && <Button label="Iniciar visita" loading={updateStatus.isPending} onPress={() => updateStatus.mutate({ visitId: visit.data!._id, payload: { status: 'IN_PROGRESS', caregiverNotes: notes || undefined } })} />}
      {canComplete && <Button label="Concluir visita" loading={updateStatus.isPending} onPress={() => updateStatus.mutate({ visitId: visit.data!._id, payload: { status: 'COMPLETED', caregiverNotes: notes || undefined } })} />}
      {(canStart || canComplete) && <Button label="Registrar ausencia" onPress={() => updateStatus.mutate({ visitId: visit.data!._id, payload: { status: 'NO_SHOW', caregiverNotes: notes || undefined } })} variant="ghost" />}
      {updateStatus.error && <Text className="text-xs text-vc-danger-dark">{updateStatus.error.message}</Text>}
    </Screen>
  );
}
