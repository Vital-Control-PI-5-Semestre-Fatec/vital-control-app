import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Clock3, Repeat2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { BarcodeScannerModal } from '../../src/components/rotinas/BarcodeScannerModal';
import { CodigoBarrasSearch } from '../../src/components/rotinas/CodigoBarrasSearch';
import { PatientTabBar } from '../../src/components/navigation/PatientTabBar';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import type {
  ApiMedication,
  ApiSchedule,
  ScheduleRecurrenceType,
} from '../../src/features/patient/api-types';
import {
  useCreateSchedule,
  useDeactivateSchedule,
  useMedications,
  useSchedules,
  useUpdateSchedule,
} from '../../src/features/patient/hooks';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

const WEEKDAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const RECURRENCE_OPTIONS: Array<{ label: string; value: ScheduleRecurrenceType }> = [
  { label: 'Diária', value: 'DAILY' },
  { label: 'Dias da semana', value: 'WEEKDAYS' },
  { label: 'Intervalo de dias', value: 'INTERVAL_DAYS' },
];

const DOSE_UNITS = [
  { value: 'TABLET', label: 'Comprimido' },
  { value: 'CAPSULE', label: 'Cápsula' },
  { value: 'DROP', label: 'Gota' },
  { value: 'ML', label: 'mL' },
  { value: 'MG', label: 'mg' },
  { value: 'UNIT', label: 'Unidade' },
];

const emptySchedule = {
  medicationId: '',
  title: '',
  quantity: '1',
  unit: 'TABLET',
  times: ['08:00'],
  newTime: '',
  recurrenceType: 'DAILY' as ScheduleRecurrenceType,
  weekdays: [1, 2, 3, 4, 5] as number[],
  intervalDays: '2',
  startDate: getTodayDisplayDate(),
  endDate: '',
  instructions: '',
};

type ScheduleForm = typeof emptySchedule;
type SchedulePickerField = 'startDate' | 'endDate' | 'newTime';

function cleanBarcode(value: string) {
  return value.replace(/\D/g, '');
}

function formatDoseUnit(unit?: string) {
  return DOSE_UNITS.find((item) => item.value === unit)?.label ?? unit ?? '';
}

function getTodayDisplayDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [dayText, monthText, yearText] = value.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  const date = new Date(year, month - 1, day);

  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return valid ? date : null;
}

function isValidDateInput(value: string) {
  return parseDisplayDate(value) !== null;
}

function dateInputToIso(value: string) {
  const date = parseDisplayDate(value);

  if (!date) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function isoToDateInput(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timePickerValue(value: string) {
  const date = new Date();

  if (isValidTime(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }

  return date;
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatRecurrence(schedule: ApiSchedule) {
  if (schedule.recurrence.type === 'DAILY') return 'Diária';

  if (schedule.recurrence.type === 'WEEKDAYS') {
    const labels = (schedule.recurrence.weekdays ?? [])
      .map((day) => WEEKDAYS.find((item) => item.value === day)?.label)
      .filter(Boolean)
      .join(', ');

    return labels ? `Dias: ${labels}` : 'Dias da semana';
  }

  return `A cada ${schedule.recurrence.intervalDays ?? 1} dia(s)`;
}

function formFromSchedule(schedule: ApiSchedule): ScheduleForm {
  return {
    medicationId: schedule.medicationId,
    title: schedule.title,
    quantity: String(schedule.dose.quantity),
    unit: schedule.dose.unit,
    times: schedule.times.length > 0 ? schedule.times : ['08:00'],
    newTime: '',
    recurrenceType: schedule.recurrence.type,
    weekdays: schedule.recurrence.weekdays ?? [1, 2, 3, 4, 5],
    intervalDays: String(schedule.recurrence.intervalDays ?? 2),
    startDate: isoToDateInput(schedule.startDate) || getTodayDisplayDate(),
    endDate: isoToDateInput(schedule.endDate),
    instructions: schedule.instructions ?? '',
  };
}

function buildRecurrence(form: ScheduleForm) {
  if (form.recurrenceType === 'DAILY') {
    return { type: 'DAILY' as const };
  }

  if (form.recurrenceType === 'WEEKDAYS') {
    return {
      type: 'WEEKDAYS' as const,
      weekdays: [...form.weekdays].sort((a, b) => a - b),
    };
  }

  return {
    type: 'INTERVAL_DAYS' as const,
    intervalDays: Number(form.intervalDays),
  };
}

function DateField({
  label,
  optional,
  value,
  onOpen,
  onClear,
}: {
  label: string;
  optional?: boolean;
  value: string;
  onOpen: () => void;
  onClear?: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-vc-text-dark">
        {label}
        {optional && <Text className="text-vc-text-muted-dark"> (opcional)</Text>}
      </Text>

      <View className="flex-row gap-2">
        <Pressable className="min-h-12 flex-1 flex-row items-center rounded-xl border border-vc-border-dark bg-vc-surface-dark px-4 active:opacity-80" onPress={onOpen}>
          <Text className={value ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>{value || 'Selecionar data'}</Text>
        </Pressable>
        {optional && !!value && onClear && <Button label="Limpar" onPress={onClear} variant="ghost" />}
      </View>
    </View>
  );
}

export default function SchedulesScreen() {
  const schedules = useSchedules();
  const medications = useMedications();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deactivateSchedule = useDeactivateSchedule();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<ScheduleForm>(emptySchedule);
  const [error, setError] = useState<string>();

  const [barcode, setBarcode] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pickerField, setPickerField] = useState<SchedulePickerField>();
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('ALL');

  const isEditing = !!editingId;
  const scheduleItems = schedules.data ?? [];
  const filteredSchedules = scheduleItems.filter((schedule) => {
    const selectedMedication = medications.data?.find(
      (medication) => medication._id === schedule.medicationId,
    );
    const isActive = schedule.active !== false;
    const matchesStatus =
      scheduleFilter === 'ALL' ||
      (scheduleFilter === 'ACTIVE' && isActive) ||
      (scheduleFilter === 'INACTIVE' && !isActive) ||
      schedule.recurrence.type === scheduleFilter;

    return matchesStatus && matchesFilterSearch(scheduleSearch, [
      schedule.title,
      selectedMedication?.name,
      schedule.instructions,
      formatRecurrence(schedule),
      schedule.times.join(' '),
    ]);
  });
  const scheduleFilterOptions = [
    { label: 'Todas', value: 'ALL', count: scheduleItems.length },
    { label: 'Ativas', value: 'ACTIVE', count: scheduleItems.filter((item) => item.active !== false).length },
    { label: 'Inativas', value: 'INACTIVE', count: scheduleItems.filter((item) => item.active === false).length },
    { label: 'Diarias', value: 'DAILY', count: scheduleItems.filter((item) => item.recurrence.type === 'DAILY').length },
    { label: 'Semana', value: 'WEEKDAYS', count: scheduleItems.filter((item) => item.recurrence.type === 'WEEKDAYS').length },
    { label: 'Intervalo', value: 'INTERVAL_DAYS', count: scheduleItems.filter((item) => item.recurrence.type === 'INTERVAL_DAYS').length },
  ];

  function openCreateModal() {
    setEditingId(undefined);
    setForm(emptySchedule);
    setBarcode('');
    setBarcodeError('');
    setError(undefined);
    setModalOpen(true);
  }

  function openEditModal(schedule: ApiSchedule) {
    const selectedMedication = medications.data?.find(
      (medication) => medication._id === schedule.medicationId,
    );

    setEditingId(schedule._id);
    setForm(formFromSchedule(schedule));
    setBarcode(selectedMedication?.barcode ?? '');
    setBarcodeError('');
    setError(undefined);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setCameraOpen(false);
    setEditingId(undefined);
    setForm(emptySchedule);
    setBarcode('');
    setBarcodeError('');
    setPickerField(undefined);
    setError(undefined);
  }

  function selectMedication(medication: ApiMedication) {
    setBarcode(medication.barcode ?? '');
    setBarcodeError('');
    setForm((current) => ({
      ...current,
      medicationId: medication._id,
      title: current.title || medication.name,
      unit: medication.stock.unit,
    }));
  }

  function toggleWeekday(day: number) {
    setForm((current) => {
      const selected = current.weekdays.includes(day);
      const weekdays = selected
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day];

      return {
        ...current,
        weekdays,
      };
    });
  }

  function addTime() {
    const time = form.newTime.trim();

    if (!isValidTime(time)) {
      setError('Informe o horário no formato HH:mm.');
      return;
    }

    if (form.times.includes(time)) {
      setError('Esse horário já foi adicionado.');
      return;
    }

    setForm((current) => ({
      ...current,
      times: [...current.times, time].sort(),
      newTime: '',
    }));
    setError(undefined);
  }

  function removeTime(time: string) {
    setForm((current) => ({
      ...current,
      times: current.times.filter((item) => item !== time),
    }));
  }

  function changePicker(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === 'android' || event.type === 'dismissed') setPickerField(undefined);
    if (event.type === 'dismissed' || !value || !pickerField) return;

    if (pickerField === 'newTime') {
      setForm((current) => ({ ...current, newTime: formatTimeValue(value) }));
    } else {
      setForm((current) => ({
        ...current,
        [pickerField]: isoToDateInput(value.toISOString()),
      }));
    }

    setError(undefined);
  }

  function validateForm() {
    if (!form.medicationId) {
      return 'Selecione um medicamento.';
    }

    if (!form.title.trim()) {
      return 'Informe o título da rotina.';
    }

    const quantity = Number(form.quantity);

    if (Number.isNaN(quantity) || quantity <= 0) {
      return 'Informe uma quantidade de dose maior que zero.';
    }

    if (!DOSE_UNITS.some((item) => item.value === form.unit)) {
      return 'Selecione uma unidade de dose válida.';
    }

    if (form.times.length === 0) {
      return 'Informe ao menos um horário.';
    }

    const invalidTime = form.times.some((time) => !isValidTime(time));

    if (invalidTime) {
      return 'Todos os horários devem estar no formato HH:mm.';
    }

    if (form.recurrenceType === 'WEEKDAYS' && form.weekdays.length === 0) {
      return 'Selecione ao menos um dia da semana.';
    }

    if (form.recurrenceType === 'INTERVAL_DAYS') {
      const intervalDays = Number(form.intervalDays);

      if (Number.isNaN(intervalDays) || intervalDays < 1) {
        return 'Informe um intervalo de dias válido.';
      }
    }

    if (!isValidDateInput(form.startDate)) {
      return 'Informe uma data inicial válida no formato DD/MM/AAAA.';
    }

    if (form.endDate && !isValidDateInput(form.endDate)) {
      return 'Informe uma data final válida no formato DD/MM/AAAA.';
    }

    if (form.endDate) {
      const startDate = parseDisplayDate(form.startDate);
      const endDate = parseDisplayDate(form.endDate);

      if (startDate && endDate && endDate < startDate) {
        return 'A data final não pode ser menor que a data inicial.';
      }
    }

    return undefined;
  }

  function save() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      medicationId: form.medicationId,
      title: form.title.trim(),
      dose: {
        quantity: Number(form.quantity),
        unit: form.unit,
      },
      times: form.times,
      recurrence: buildRecurrence(form),
      startDate: dateInputToIso(form.startDate),
      endDate: form.endDate ? dateInputToIso(form.endDate) : undefined,
      timezone: 'America/Sao_Paulo',
      instructions: form.instructions.trim() || undefined,
    };

    if (isEditing && editingId) {
      updateSchedule.mutate(
        {
          scheduleId: editingId,
          payload,
        },
        {
          onSuccess: closeModal,
          onError: (requestError: Error) => setError(requestError.message),
        },
      );

      return;
    }

    createSchedule.mutate(payload, {
      onSuccess: closeModal,
      onError: (requestError: Error) => setError(requestError.message),
    });
  }

  function deactivate(scheduleId: string) {
    deactivateSchedule.mutate(scheduleId, {
      onError: (requestError: Error) => setError(requestError.message),
    });
  }

  async function searchMedicationByBarcode(nextBarcode = barcode): Promise<boolean> {
    const cleanedBarcode = cleanBarcode(nextBarcode);

    if (!cleanedBarcode) {
      setBarcodeError('Informe o código de barras.');
      return false;
    }

    setBarcode(cleanedBarcode);
    setBarcodeError('');
    setBarcodeSearching(true);

    try {
      const availableMedications =
        medications.data ?? (await medications.refetch()).data ?? [];

      const foundMedication = availableMedications.find(
        (medication: ApiMedication) =>
          cleanBarcode(medication.barcode ?? '') === cleanedBarcode,
      );

      if (!foundMedication) {
        setBarcodeError(
          'Medicamento não encontrado. Cadastre o medicamento ou selecione manualmente.',
        );
        return false;
      }

      selectMedication(foundMedication);
      setError(undefined);
      return true;
    } catch (requestError) {
      setBarcodeError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível consultar os medicamentos.',
      );
      return false;
    } finally {
      setBarcodeSearching(false);
    }
  }

  async function handleCodeScanned(scannedBarcode: string) {
    setBarcode(scannedBarcode);
    return searchMedicationByBarcode(scannedBarcode);
  }

  return (
    <Screen
      title="Minhas rotinas"
      subtitle="Cadastre horários, recorrências e doses dos medicamentos."
    >
      {schedules.isFetching && <ActivityIndicator color={colors.secondary} />}

      {schedules.error && (
        <Text className="text-sm text-vc-danger-dark">{schedules.error.message}</Text>
      )}

      <ListFilters
        onOptionChange={setScheduleFilter}
        onSearchChange={setScheduleSearch}
        options={scheduleFilterOptions}
        placeholder="Buscar por rotina, medicamento ou horario"
        resultCount={filteredSchedules.length}
        search={scheduleSearch}
        selectedOption={scheduleFilter}
      />

      {filteredSchedules.map((schedule: ApiSchedule) => {
        const selectedMedication = medications.data?.find(
          (medication) => medication._id === schedule.medicationId,
        );
        const isActive = schedule.active !== false;

        return (
          <Card className={isActive ? 'gap-3' : 'gap-3 opacity-60'} key={schedule._id}>
            <View className="flex-row gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-vc-surface-raised-dark">
                <Repeat2 color={colors.secondary} size={19} />
              </View>

              <View className="flex-1 gap-1">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-vc-text-dark">
                      {schedule.title}
                    </Text>

                    {!!selectedMedication && (
                      <Text className="text-xs text-vc-text-muted-dark">
                        Medicamento: {selectedMedication.name}
                      </Text>
                    )}
                  </View>

                  <StatusBadge
                    label={isActive ? 'Ativa' : 'Inativa'}
                    tone={isActive ? 'success' : 'warning'}
                  />
                </View>

                <Text className="text-sm text-vc-text-muted-dark">
                  Dose: {schedule.dose.quantity} {formatDoseUnit(schedule.dose.unit)}
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
                  Início: {isoToDateInput(schedule.startDate)}
                  {schedule.endDate ? ` | Fim: ${isoToDateInput(schedule.endDate)}` : ''}
                </Text>

                {!!schedule.instructions && (
                  <Text className="text-xs text-vc-text-muted-dark">
                    Instruções: {schedule.instructions}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                label="Editar"
                onPress={() => openEditModal(schedule)}
                variant="ghost"
              />

              {isActive && (
                <Button
                  className="flex-1"
                  label="Desativar"
                  loading={deactivateSchedule.isPending}
                  onPress={() => deactivate(schedule._id)}
                  variant="ghost"
                />
              )}
            </View>
          </Card>
        );
      })}

      {!schedules.isFetching && !filteredSchedules.length && (
        <Text className="text-sm text-vc-text-muted-dark">Nenhuma rotina encontrada para os filtros.</Text>
      )}

      <Button label="Adicionar rotina" onPress={openCreateModal} />

      <ModalSheet
        footer={
          <Button
            label={isEditing ? 'Salvar alterações' : 'Criar rotina'}
            loading={createSchedule.isPending || updateSchedule.isPending}
            onPress={save}
          />
        }
        onClose={closeModal}
        title={isEditing ? 'Editar rotina' : 'Nova rotina'}
        visible={modalOpen}
      >
        <CodigoBarrasSearch
          barcodeError={barcodeError}
          barcodeSearching={barcodeSearching}
          codigoBarras={barcode}
          onAbrirCamera={() => setCameraOpen(true)}
          onBuscarCodigo={() => void searchMedicationByBarcode()}
          onChangeCodigo={(value: string) => {
            setBarcode(cleanBarcode(value));
            setBarcodeError('');
          }}
          onClearCodigo={() => {
            setBarcode('');
            setBarcodeError('');
          }}
          primaryColor={colors.primary}
          textMutedColor={colors.textMuted}
        />

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-vc-border-dark" />
          <Text className="text-xs text-vc-text-muted-dark">ou selecione abaixo</Text>
          <View className="h-px flex-1 bg-vc-border-dark" />
        </View>

        <Text className="text-xs font-bold text-vc-text-muted-dark">
          Selecione o medicamento
        </Text>

        {medications.isLoading && <ActivityIndicator color={colors.secondary} size="small" />}
        {medications.error && <Text className="text-xs text-vc-danger-dark">Erro ao carregar medicamentos.</Text>}
        {!medications.isLoading && !medications.error && (medications.data ?? []).filter((m: ApiMedication) => m.active !== false).length === 0 && (
          <Text className="text-xs text-vc-text-muted-dark">Nenhum medicamento cadastrado. Adicione um na aba Estoque antes de criar uma rotina.</Text>
        )}

        <View className="flex-row flex-wrap gap-2">
          {(medications.data ?? [])
            .filter((medication: ApiMedication) => medication.active !== false)
            .map((medication: ApiMedication) => (
              <Pressable
                className={
                  form.medicationId === medication._id
                    ? 'rounded-xl bg-vc-secondary-dark px-3 py-2'
                    : 'rounded-xl border border-vc-border-dark px-3 py-2'
                }
                key={medication._id}
                onPress={() => selectMedication(medication)}
              >
                <Text
                  className={
                    form.medicationId === medication._id
                      ? 'text-xs font-bold text-vc-bg-dark'
                      : 'text-xs text-vc-text-muted-dark'
                  }
                >
                  {medication.name}
                </Text>
              </Pressable>
            ))}
        </View>

        <Input
          label="Título"
          onChangeText={(title) => setForm({ ...form, title })}
          value={form.title}
        />

        <Input
          keyboardType="decimal-pad"
          label="Quantidade da dose"
          onChangeText={(quantity) => setForm({ ...form, quantity })}
          value={form.quantity}
        />

        <View className="gap-2">
          <Text className="text-sm font-semibold text-vc-text-dark">
            Unidade da dose
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {DOSE_UNITS.map((unit) => {
              const selected = form.unit === unit.value;

              return (
                <Pressable
                  className={
                    selected
                      ? 'rounded-xl bg-vc-primary-dark px-3 py-2'
                      : 'rounded-xl bg-vc-surface-dark px-3 py-2'
                  }
                  key={unit.value}
                  onPress={() => setForm({ ...form, unit: unit.value })}
                >
                  <Text
                    className={
                      selected
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-vc-text-muted-dark'
                    }
                  >
                    {unit.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-vc-text-dark">Horários</Text>

          <View className="flex-row flex-wrap gap-2">
            {form.times.map((time) => (
              <Pressable
                className="rounded-xl bg-vc-primary-dark px-3 py-2"
                key={time}
                onPress={() => removeTime(time)}
              >
                <Text className="text-xs font-semibold text-white">{time} ×</Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 gap-1.5">
              <Text className="text-sm font-semibold text-vc-text-dark">Novo horário</Text>
              <Pressable
                className="min-h-12 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 active:opacity-80"
                onPress={() => setPickerField('newTime')}
              >
                <Clock3 color={colors.secondary} size={18} />
                <Text className={form.newTime ? 'text-vc-text-dark' : 'text-vc-text-muted-dark'}>
                  {form.newTime || 'Selecionar horário'}
                </Text>
              </Pressable>
            </View>

            <View className="justify-end">
              <Button label="Adicionar" onPress={addTime} variant="ghost" />
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-vc-text-dark">
            Recorrência
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((option) => {
              const selected = form.recurrenceType === option.value;

              return (
                <Pressable
                  className={
                    selected
                      ? 'rounded-xl bg-vc-primary-dark px-3 py-2'
                      : 'rounded-xl bg-vc-surface-dark px-3 py-2'
                  }
                  key={option.value}
                  onPress={() => setForm({ ...form, recurrenceType: option.value })}
                >
                  <Text
                    className={
                      selected
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-vc-text-muted-dark'
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {form.recurrenceType === 'WEEKDAYS' && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-vc-text-dark">
              Dias da semana
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = form.weekdays.includes(day.value);

                return (
                  <Pressable
                    className={
                      selected
                        ? 'rounded-xl bg-vc-secondary-dark px-3 py-2'
                        : 'rounded-xl bg-vc-surface-dark px-3 py-2'
                    }
                    key={day.value}
                    onPress={() => toggleWeekday(day.value)}
                  >
                    <Text
                      className={
                        selected
                          ? 'text-xs font-semibold text-white'
                          : 'text-xs font-semibold text-vc-text-muted-dark'
                      }
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {form.recurrenceType === 'INTERVAL_DAYS' && (
          <Input
            keyboardType="numeric"
            label="Intervalo de dias"
            onChangeText={(intervalDays) => setForm({ ...form, intervalDays })}
            placeholder="Ex.: 2"
            value={form.intervalDays}
          />
        )}

        <DateField
          label="Data inicial"
          onOpen={() => setPickerField('startDate')}
          value={form.startDate}
        />

        <DateField
          label="Data final"
          optional
          onClear={() => setForm({ ...form, endDate: '' })}
          onOpen={() => setPickerField('endDate')}
          value={form.endDate}
        />

        {pickerField && (
          <View className="gap-2">
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={pickerField === 'endDate' ? parseDisplayDate(form.startDate) ?? new Date() : undefined}
              mode={pickerField === 'newTime' ? 'time' : 'date'}
              onChange={changePicker}
              value={pickerField === 'newTime' ? timePickerValue(form.newTime) : parseDisplayDate(pickerField === 'startDate' ? form.startDate : form.endDate) ?? new Date()}
            />
            {Platform.OS === 'ios' && <Button label="Confirmar selecao" onPress={() => setPickerField(undefined)} variant="ghost" />}
          </View>
        )}

        <Input
          label="Instruções"
          onChangeText={(instructions) => setForm({ ...form, instructions })}
          placeholder="Ex.: tomar após o almoço"
          value={form.instructions}
        />

        {error && <Text className="text-xs text-vc-danger-dark">{error}</Text>}
      </ModalSheet>

      <BarcodeScannerModal
        onClose={() => setCameraOpen(false)}
        onCodeScanned={handleCodeScanned}
        searching={barcodeSearching}
        visible={cameraOpen}
      />
    </Screen>
  );
}
