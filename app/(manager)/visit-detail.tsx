import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarCheck, Clock3, MapPin, UserCog } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EligibleUserPicker } from '../../src/features/operations/components/EligibleUserPicker';
import { useAssignVisit, useCancelVisit, useCareGroups, useEligibleUsers, useOperationalVisit } from '../../src/features/operations/hooks';
import { formatVisitWindow, patientInitials, visitStatusLabel, visitStatusTone } from '../../src/features/operations/ui';
import { colors } from '../../src/theme/colors';
import { cn } from '../../src/utils/cn';

type PickerField = 'date' | 'startTime' | 'endTime';

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function displayDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Selecionar data';
}

function pickerValue(field: PickerField, date: string, startTime: string, endTime: string) {
  if (field === 'date' && date) return new Date(`${date}T12:00:00`);

  const time = field === 'startTime' ? startTime : endTime;
  const value = new Date();

  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    value.setHours(hours, minutes, 0, 0);
  }

  return value;
}

export default function ManagerVisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const visit = useOperationalVisit(id);
  const groups = useCareGroups();
  const caregivers = useEligibleUsers('CAREGIVER');
  const assignVisit = useAssignVisit();
  const cancelVisit = useCancelVisit();
  const [careGroupId, setCareGroupId] = useState('');
  const [caregiverId, setCaregiverId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [pickerField, setPickerField] = useState<PickerField>();
  const [cancelNotes, setCancelNotes] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    if (!visit.data) return;
    const window = visit.data.scheduledWindow ?? visit.data.requestedWindow;
    setCareGroupId(visit.data.careGroupId ?? '');
    setCaregiverId(visit.data.assignedCaregiverId ?? '');
    setDate(window.start.slice(0, 10));
    setStartTime(new Date(window.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setEndTime(new Date(window.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, [visit.data?._id]);

  if (visit.isFetching && !visit.data) return <Screen title="Atendimento"><ActivityIndicator color={colors.secondary} /></Screen>;
  if (!visit.data) return <Screen title="Atendimento"><Card><Text className="text-sm text-vc-text-muted-dark">Atendimento não encontrado.</Text></Card><Button label="Voltar" onPress={() => router.back()} variant="ghost" /></Screen>;

  const groupOptions = (groups.data ?? []).filter(
    (group) => group.status === 'ACTIVE' && group.patientIds.includes(visit.data?.patientId ?? ''),
  );
  const selectedGroup = groupOptions.find((group) => group._id === careGroupId);
  const caregiverOptions = selectedGroup
    ? (caregivers.data ?? []).filter((caregiver) => selectedGroup.caregiverIds.includes(caregiver.id))
    : [];

  function saveAssignment() {
    setAssignmentError('');
    if (!visit.data) return;
    if (!selectedGroup) {
      setAssignmentError('Selecione um grupo ativo vinculado ao paciente.');
      return;
    }
    if (!caregiverId || !selectedGroup.caregiverIds.includes(caregiverId)) {
      setAssignmentError('Selecione um cuidador vinculado ao grupo escolhido.');
      return;
    }
    if (!date || !startTime || !endTime) {
      setAssignmentError('Preencha a data e os horários do atendimento.');
      return;
    }

    assignVisit.mutate({
      visitId: visit.data._id,
      payload: {
        careGroupId,
        assignedCaregiverId: caregiverId,
        scheduledWindow: {
          start: new Date(`${date}T${startTime}:00`).toISOString(),
          end: new Date(`${date}T${endTime}:00`).toISOString(),
        },
      },
    });
  }

  function changePicker(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === 'android' || event.type === 'dismissed') setPickerField(undefined);
    if (event.type === 'dismissed' || !value || !pickerField) return;

    if (pickerField === 'date') setDate(formatDateValue(value));
    if (pickerField === 'startTime') setStartTime(formatTimeValue(value));
    if (pickerField === 'endTime') setEndTime(formatTimeValue(value));
    setAssignmentError('');
  }

  return (
    <Screen title="Atribuição" subtitle={`Paciente ${patientInitials(visit.data.patientId)}`}>
      <View className="gap-3 rounded-2xl border border-vc-primary-dark bg-vc-surface-dark p-4">
        <View className="flex-row items-center justify-between">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-vc-bg-dark">
            <CalendarCheck color={colors.secondary} size={22} />
          </View>
          <StatusBadge label={visitStatusLabel[visit.data.status]} tone={visitStatusTone(visit.data.status)} />
        </View>
        <View>
          <Text className="text-xs font-semibold uppercase text-vc-text-muted-dark">Solicitação</Text>
          <Text className="mt-1 text-lg font-bold text-vc-text-dark">{visit.data.reason}</Text>
        </View>
        <View className="gap-2 rounded-xl bg-vc-bg-dark p-3">
          <View className="flex-row items-center gap-2">
            <Clock3 color={colors.primary} size={16} />
            <Text className="text-sm font-semibold text-vc-primary-dark">{formatVisitWindow(visit.data)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPin color={colors.textMuted} size={16} />
            <Text className="flex-1 text-xs leading-5 text-vc-text-muted-dark">{visit.data.addressSnapshot.street}, {visit.data.addressSnapshot.number} - {visit.data.addressSnapshot.city}/{visit.data.addressSnapshot.state}</Text>
          </View>
        </View>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <UserCog color={colors.secondary} size={18} />
          <Text className="text-base font-bold text-vc-text-dark">Definir atendimento</Text>
        </View>
        <View className="rounded-xl border border-vc-border-dark bg-vc-bg-dark p-3">
          <Text className="text-xs text-vc-text-muted-dark">Paciente da solicitação</Text>
          <Text className="mt-1 text-sm font-bold text-vc-text-dark">Paciente {patientInitials(visit.data.patientId)}</Text>
          <Text className="mt-1 text-xs text-vc-text-muted-dark">ID: {visit.data.patientId}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-vc-primary-dark">
            <Text className="text-xs font-bold text-vc-bg-dark">1</Text>
          </View>
          <Text className="text-sm font-bold text-vc-text-dark">Grupo de cuidado</Text>
        </View>
        <View className="gap-2">
          {groupOptions.map((group) => (
            <Pressable
              className={cn('rounded-xl border p-3 active:opacity-70', careGroupId === group._id ? 'border-vc-secondary-dark bg-vc-surface-raised-dark' : 'border-vc-border-dark')}
              key={group._id}
              onPress={() => {
                setCareGroupId(group._id);
                setCaregiverId('');
                setAssignmentError('');
              }}
            >
              <Text className="text-sm font-bold text-vc-text-dark">{group.name}</Text>
              <Text className="text-xs text-vc-text-muted-dark">{group.patientIds.length} paciente(s): {group.patientIds.map(patientInitials).join(', ')} | {group.caregiverIds.length} cuidador(es)</Text>
            </Pressable>
          ))}
          {!groups.isFetching && !groupOptions.length && <Text className="text-xs text-vc-danger-dark">Nenhum grupo ativo deste gerente possui o paciente da solicitação.</Text>}
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-vc-primary-dark">
            <Text className="text-xs font-bold text-vc-bg-dark">2</Text>
          </View>
          <Text className="text-sm font-bold text-vc-text-dark">Cuidador elegível</Text>
        </View>
        <EligibleUserPicker
          emptyMessage={selectedGroup ? 'Nenhum cuidador vinculado ao grupo selecionado.' : 'Selecione um grupo para ver cuidadores elegiveis.'}
          label="Selecionar cuidador do grupo"
          onChange={(ids) => setCaregiverId(ids[0] ?? '')}
          selectedIds={caregiverId ? [caregiverId] : []}
          users={caregiverOptions}
        />
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-vc-primary-dark">
            <Text className="text-xs font-bold text-vc-bg-dark">3</Text>
          </View>
          <Text className="text-sm font-bold text-vc-text-dark">Horario</Text>
        </View>
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-vc-text-dark">Data</Text>
          <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('date')}>
            <CalendarCheck color={colors.secondary} size={18} />
            <Text className={date ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{displayDate(date)}</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1 gap-1.5">
            <Text className="text-sm font-semibold text-vc-text-dark">Inicio</Text>
            <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('startTime')}>
              <Clock3 color={colors.secondary} size={18} />
              <Text className={startTime ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{startTime || 'Selecionar'}</Text>
            </Pressable>
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-sm font-semibold text-vc-text-dark">Fim</Text>
            <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('endTime')}>
              <Clock3 color={colors.secondary} size={18} />
              <Text className={endTime ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{endTime || 'Selecionar'}</Text>
            </Pressable>
          </View>
        </View>
        {pickerField && (
          <View className="gap-2">
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={pickerField === 'date' ? new Date() : undefined}
              mode={pickerField === 'date' ? 'date' : 'time'}
              onChange={changePicker}
              value={pickerValue(pickerField, date, startTime, endTime)}
            />
            {Platform.OS === 'ios' && <Button label="Confirmar selecao" onPress={() => setPickerField(undefined)} variant="ghost" />}
          </View>
        )}
        <Button label={visit.data.assignedCaregiverId ? 'Alterar cuidador' : 'Atribuir cuidador'} loading={assignVisit.isPending} onPress={saveAssignment} />
        {assignmentError && <Text className="text-xs text-vc-danger-dark">{assignmentError}</Text>}
        {assignVisit.error && <Text className="text-xs text-vc-danger-dark">{assignVisit.error.message}</Text>}
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-bold text-vc-text-dark">Cancelamento pelo gerente</Text>
        <Input label="Motivo operacional" multiline onChangeText={setCancelNotes} value={cancelNotes} />
        <Button disabled={visit.data.status === 'COMPLETED' || visit.data.status === 'CANCELLED'} label="Cancelar atendimento" loading={cancelVisit.isPending} onPress={() => cancelVisit.mutate({ visitId: visit.data!._id, notes: cancelNotes || 'Cancelado pelo gerente.' })} variant="danger" />
      </Card>
    </Screen>
  );
}
