import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarCheck, UserRound, MapPin, Info, Edit, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { usePatientVisit, useCancelVisit, useEditVisit } from '../../src/features/patient/hooks';
import { colors } from '../../src/theme/colors';

export default function PatientVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const visit = usePatientVisit(id);
  const cancelVisit = useCancelVisit();
  const editVisit = useEditVisit();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (visit.isFetching && !visit.data) return <Screen title="Atendimento"><ActivityIndicator color={colors.secondary} /></Screen>;
  if (!visit.data) return <Screen title="Atendimento"><Card><Text className="text-sm text-vc-text-muted-dark">Não encontrado.</Text></Card><Button label="Voltar" onPress={() => router.back()} variant="ghost" /></Screen>;

  const window = visit.data.scheduledWindow ?? visit.data.requestedWindow;
  const isEditable = visit.data.status === 'REQUESTED';
  const canCancel = ['REQUESTED', 'TRIAGED', 'SCHEDULED'].includes(visit.data.status);

  function handleEditOpen() {
    setReason(visit.data!.reason);
    setEditModalOpen(true);
  }

  function saveEdit() {
    editVisit.mutate({ visitId: visit.data!._id, payload: { reason } }, { onSuccess: () => setEditModalOpen(false) });
  }

  return (
    <Screen title="Detalhes do Atendimento">
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <CalendarCheck color={colors.secondary} size={22} />
          <StatusBadge label={visit.data.status} tone={visit.data.status === 'COMPLETED' ? 'success' : visit.data.status === 'CANCELLED' ? 'danger' : 'info'} />
        </View>
        <Text className="text-base font-bold text-vc-text-dark">{visit.data.reason}</Text>
        <Text className="text-sm font-semibold text-vc-primary-dark">{new Date(window.start).toLocaleString('pt-BR')} as {new Date(window.end).toLocaleTimeString('pt-BR')}</Text>
        <View className="flex-row items-center gap-1.5"><MapPin color={colors.textMuted} size={16} /><Text className="text-xs leading-5 text-vc-text-muted-dark flex-1">{visit.data.addressSnapshot.street}, {visit.data.addressSnapshot.number} - {visit.data.addressSnapshot.city}</Text></View>
      </Card>

      <Card className="gap-3 border-vc-primary-dark">
        <View className="flex-row items-center gap-2"><UserRound color={colors.secondary} size={18} /><Text className="text-base font-bold text-vc-text-dark">Profissional Atribuido</Text></View>
        <Text className="text-sm text-vc-text-muted-dark">{visit.data.assignedCaregiverId ? 'Cuidador confirmado (ID omitido por privacidade)' : 'Aguardando atribuição pela triagem.'}</Text>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2"><Info color={colors.secondary} size={18} /><Text className="text-base font-bold text-vc-text-dark">Histórico / Eventos</Text></View>
        <View className="border-l border-vc-border-dark ml-2 pl-4 py-1 gap-4">
            <View><Text className="text-sm font-bold text-vc-text-dark">Solicitação criada</Text><Text className="text-xs text-vc-text-muted-dark">Aguardando análise gerencial</Text></View>
            {visit.data.status === 'TRIAGED' && <View><Text className="text-sm font-bold text-vc-text-dark">Triagem Finalizada</Text><Text className="text-xs text-vc-text-muted-dark">Aprovado pelo gerente de cuidado</Text></View>}
            {visit.data.status === 'SCHEDULED' && <View><Text className="text-sm font-bold text-vc-text-dark">Agendado</Text><Text className="text-xs text-vc-text-muted-dark">Cuidador definido e janela confirmada</Text></View>}
            {visit.data.status === 'IN_PROGRESS' && <View><Text className="text-sm font-bold text-vc-text-dark">Em Andamento</Text><Text className="text-xs text-vc-text-muted-dark">Profissional iniciou o atendimento</Text></View>}
        </View>
      </Card>

      {isEditable && <Button label="Editar solicitação" variant="secondary" onPress={handleEditOpen} />}
      {canCancel && <Button label="Cancelar Atendimento" loading={cancelVisit.isPending} onPress={() => { cancelVisit.mutate(visit.data!._id); router.back(); }} variant="danger" />}
      
      <ModalSheet footer={<Button label="Salvar Edicao" loading={editVisit.isPending} onPress={saveEdit} />} onClose={() => setEditModalOpen(false)} title="Editar Atendimento" visible={editModalOpen}>
         <Input label="Motivo (Apenas se REQUESTED)" onChangeText={setReason} value={reason} />
      </ModalSheet>
    </Screen>
  );
}
