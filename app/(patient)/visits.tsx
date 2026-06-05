import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { CalendarDays, Clock3, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useCreateVisit, usePatientProfile, useVisits } from '../../src/features/patient/hooks';
import { formatCep, lookupCep } from '../../src/services/api/cep';
import { colors } from '../../src/theme/colors';

const emptyVisit = { reason: '', date: '', startTime: '', endTime: '', street: '', number: '', neighborhood: '', complement: '', city: '', state: '', zipCode: '', notes: '' };
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

function pickerValue(field: PickerField, form: typeof emptyVisit) {
  if (field === 'date' && form.date) return new Date(`${form.date}T12:00:00`);
  const time = field === 'startTime' ? form.startTime : form.endTime;
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    const value = new Date();
    value.setHours(hours, minutes, 0, 0);
    return value;
  }
  return new Date();
}

function displayDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Selecionar data';
}

export default function VisitsScreen() {
  const visits = useVisits();
  const profile = usePatientProfile();
  const createVisit = useCreateVisit();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyVisit);
  const [error, setError] = useState<string>();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string>();
  const [pickerField, setPickerField] = useState<PickerField>();

  function openCreate() {
    const address = profile.data?.defaultAddress;
    setForm({ ...emptyVisit, street: address?.street ?? '', number: address?.number ?? '', neighborhood: address?.neighborhood ?? '', complement: address?.complement ?? '', city: address?.city ?? '', state: address?.state ?? '', zipCode: address?.zipCode ?? '' });
    setError(undefined);
    setCepError(undefined);
    setPickerField(undefined);
    setModalOpen(true);
  }

  function save() {
    if (!form.reason || !form.date || !form.startTime || !form.endTime || !form.street || !form.number || !form.city || !form.state || !form.zipCode) return setError('Preencha o motivo, a janela de horário e o endereço completo.');
    if (form.endTime <= form.startTime) return setError('O horário final deve ser posterior ao horário inicial.');
    createVisit.mutate({ reason: form.reason, patientNotes: form.notes, requestedWindow: { start: new Date(`${form.date}T${form.startTime}:00`).toISOString(), end: new Date(`${form.date}T${form.endTime}:00`).toISOString() }, addressSnapshot: { street: form.street, number: form.number, neighborhood: form.neighborhood, complement: form.complement, city: form.city, state: form.state, zipCode: form.zipCode } }, { onSuccess: () => { setModalOpen(false); setForm(emptyVisit); }, onError: (requestError) => setError(requestError.message) });
  }

  async function searchCep() {
    setCepError(undefined);
    setCepLoading(true);

    try {
      const address = await lookupCep(form.zipCode);
      setForm((current) => ({
        ...current,
        street: address.street || current.street,
        neighborhood: address.neighborhood || current.neighborhood,
        city: address.city || current.city,
        state: address.state || current.state,
        zipCode: address.zipCode,
      }));
    } catch (requestError) {
      setCepError(requestError instanceof Error ? requestError.message : 'Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  }

  function changePicker(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === 'android' || event.type === 'dismissed') setPickerField(undefined);
    if (event.type === 'dismissed' || !value || !pickerField) return;

    setForm({
      ...form,
      [pickerField]: pickerField === 'date' ? formatDateValue(value) : formatTimeValue(value),
    });
    setError(undefined);
  }

  return (
    <Screen title="Atendimentos" subtitle="Acompanhe o histórico de visitas.">
      {visits.isFetching && <ActivityIndicator color={colors.secondary} />}
      {visits.error && <Text className="text-sm text-vc-danger-dark">{visits.error.message}</Text>}
      
      {(visits.data ?? []).map((visit) => {
        const window = visit.scheduledWindow ?? visit.requestedWindow;
        return (
          // O LINK FOI ADICIONADO AQUI!
          <Link asChild href={{ pathname: '/(patient)/visit-detail', params: { id: visit._id } }} key={visit._id}>
            <Card className="gap-2.5 active:opacity-80">
              <View className="flex-row items-center justify-between"><CalendarDays color={colors.secondary} size={22} /><StatusBadge label={visit.status} tone={visit.status === 'COMPLETED' ? 'success' : visit.status === 'CANCELLED' ? 'danger' : 'info'} /></View>
              <Text className="text-base font-bold text-vc-text-dark">{visit.reason}</Text>
              <Text className="text-sm font-semibold text-vc-primary-dark">{new Date(window.start).toLocaleString('pt-BR')} - {new Date(window.end).toLocaleTimeString('pt-BR')}</Text>
              <View className="flex-row items-center gap-1"><MapPin color={colors.textMuted} size={15} /><Text className="text-xs text-vc-text-muted-dark">{visit.addressSnapshot.street}, {visit.addressSnapshot.number}</Text></View>
            </Card>
          </Link>
        );
      })}
      
      {!visits.isFetching && !visits.data?.length && <Text className="text-sm text-vc-text-muted-dark">Nenhum atendimento solicitado.</Text>}
      <Button label="Solicitar atendimento" onPress={openCreate} />
      
      <ModalSheet footer={<Button label="Enviar solicitação" loading={createVisit.isPending} onPress={save} />} onClose={() => setModalOpen(false)} title="Novo atendimento" visible={modalOpen}>
        <Input label="Motivo" onChangeText={(reason) => setForm({ ...form, reason })} value={form.reason} />
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-vc-text-dark">Data</Text>
          <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('date')}>
            <CalendarDays color={colors.secondary} size={18} />
            <Text className={form.date ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{displayDate(form.date)}</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1 gap-1.5">
            <Text className="text-sm font-semibold text-vc-text-dark">Inicio</Text>
            <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('startTime')}>
              <Clock3 color={colors.secondary} size={18} />
              <Text className={form.startTime ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{form.startTime || 'Selecionar'}</Text>
            </Pressable>
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-sm font-semibold text-vc-text-dark">Fim</Text>
            <Pressable className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80" onPress={() => setPickerField('endTime')}>
              <Clock3 color={colors.secondary} size={18} />
              <Text className={form.endTime ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{form.endTime || 'Selecionar'}</Text>
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
              value={pickerValue(pickerField, form)}
            />
            {Platform.OS === 'ios' && <Button label="Confirmar selecao" onPress={() => setPickerField(undefined)} variant="ghost" />}
          </View>
        )}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input label="CEP" keyboardType="numeric" onChangeText={(zipCode) => setForm({ ...form, zipCode: formatCep(zipCode) })} value={form.zipCode} />
          </View>
          <View className="justify-end">
            <Button label="Buscar CEP" loading={cepLoading} onPress={searchCep} variant="ghost" />
          </View>
        </View>
        {cepError && <Text className="text-xs text-vc-danger-dark">{cepError}</Text>}
        <Input label="Rua" onChangeText={(street) => setForm({ ...form, street })} value={form.street} /><Input label="Numero" onChangeText={(number) => setForm({ ...form, number })} value={form.number} />
        <View className="flex-row gap-2"><View className="flex-1"><Input label="Bairro" onChangeText={(neighborhood) => setForm({ ...form, neighborhood })} value={form.neighborhood} /></View><View className="flex-1"><Input label="Comp." onChangeText={(complement) => setForm({ ...form, complement })} value={form.complement} /></View></View>
        <View className="flex-row gap-2"><View className="flex-1"><Input label="Cidade" onChangeText={(city) => setForm({ ...form, city })} value={form.city} /></View><View className="w-20"><Input label="UF" onChangeText={(state) => setForm({ ...form, state })} value={form.state} /></View></View>
        <Input label="Observações" multiline onChangeText={(notes) => setForm({ ...form, notes })} value={form.notes} />
        {error && <Text className="text-xs text-vc-danger-dark">{error}</Text>}
      </ModalSheet>
    </Screen>
  );
}
