import { Bell, Check, Clock3, XCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { DateNavigator } from '../../src/components/ui/DateNavigator';
import { Input } from '../../src/components/ui/Input';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useAdministrations, useMedications, useSchedules, useUpdateAdministrationStatus } from '../../src/features/patient/hooks';
import type { AdministrationStatus, ApiAdministration } from '../../src/features/patient/api-types';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

const statusLabel: Record<AdministrationStatus, string> = {
  PENDING: 'Pendente',
  TAKEN_ON_TIME: 'Tomado',
  TAKEN_LATE: 'Tomado com atraso',
  MISSED: 'Não tomado',
  SKIPPED: 'Ignorado',
};

export default function HomeScreen() {
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [doseSearch, setDoseSearch] = useState('');
  const [doseStatus, setDoseStatus] = useState('ALL');
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<ApiAdministration | null>(null);
  const [justification, setJustification] = useState('');

  const administrations = useAdministrations(dateKey(selectedDate));
  const medications = useMedications();
  const schedules = useSchedules();
  const updateStatus = useUpdateAdministrationStatus();
  
  const firstName = session?.user.name.split(' ')[0] ?? 'Paciente';
  const selectedAdministrations = (administrations.data ?? []).filter((item) => item.scheduledFor.slice(0, 10) === dateKey(selectedDate));
  const filteredAdministrations = selectedAdministrations.filter((item) => {
    const matchesStatus =
      doseStatus === 'ALL' ||
      item.status === doseStatus ||
      (doseStatus === 'TAKEN' && (item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE'));

    return matchesStatus && matchesFilterSearch(doseSearch, [
      item.medicationSnapshot.name,
      item.medicationSnapshot.dosageDescription,
      statusLabel[item.status],
      item.justification,
    ]);
  });
  const doseFilterOptions = [
    { label: 'Todas', value: 'ALL', count: selectedAdministrations.length },
    { label: 'Pendentes', value: 'PENDING', count: selectedAdministrations.filter((item) => item.status === 'PENDING').length },
    { label: 'Tomadas', value: 'TAKEN', count: selectedAdministrations.filter((item) => item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE').length },
    { label: 'Nao tomadas', value: 'MISSED', count: selectedAdministrations.filter((item) => item.status === 'MISSED').length },
    { label: 'Ignoradas', value: 'SKIPPED', count: selectedAdministrations.filter((item) => item.status === 'SKIPPED').length },
  ];
  const lowStock = (medications.data ?? []).filter((item) => item.stock.lowStockThreshold !== undefined && item.stock.currentQuantity <= item.stock.lowStockThreshold);
  
  const notifications = useMemo(() => [
    `${selectedAdministrations.filter((item) => item.status === 'PENDING').length} dose(s) pendente(s).`,
    lowStock.length ? `${lowStock.length} medicamento(s) com estoque baixo.` : 'Todos os estoques em nivel adequado.',
  ], [lowStock.length, selectedAdministrations]);

  async function handleSyncAlarms() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const { requestNotificationPermission, syncAllAlarms } = await import('../../src/services/notifications');
      const granted = await requestNotificationPermission();
      if (!granted) {
        setSyncMessage('Permissão negada. Ative nas configurações do dispositivo.');
        return;
      }
      if (!schedules.data?.length) {
        setSyncMessage('Nenhuma rotina encontrada.');
        return;
      }
      await syncAllAlarms(schedules.data);
      const active = schedules.data.filter((s) => s.active).length;
      setSyncMessage(`${active} alarme(s) sincronizado(s).`);
    } catch {
      setSyncMessage('Erro ao sincronizar alarmes.');
    } finally {
      setSyncing(false);
    }
  }

  function openActionModal(admin: ApiAdministration) {
    setSelectedAdmin(admin);
    setJustification(admin.justification ?? '');
    setActionModalOpen(true);
  }

  function handleUpdateStatus(status: AdministrationStatus) {
    if (!selectedAdmin) return;
    updateStatus.mutate({ administrationId: selectedAdmin._id, status, justification }, {
      onSuccess: () => setActionModalOpen(false)
    });
  }

  return (
    <Screen title={`Olá, ${firstName}`} action={<Pressable className="relative rounded-full bg-vc-surface-dark p-2" onPress={() => setNotificationsOpen((current) => !current)}><Bell color={colors.secondary} size={21} /><View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-vc-danger-dark" /></Pressable>}>
      {notificationsOpen && (
        <Card className="gap-2 border-vc-primary-dark">
          <Text className="text-base font-bold text-vc-text-dark">Notificações</Text>
          {notifications.map((item) => <Text className="text-sm text-vc-text-muted-dark" key={item}>- {item}</Text>)}
          <View className="h-px bg-vc-border-dark" />
          <Button label={syncing ? 'Sincronizando...' : 'Sincronizar alarmes de medicamento'} loading={syncing} onPress={handleSyncAlarms} variant="ghost" />
          {!!syncMessage && <Text className={`text-xs ${syncMessage.includes('Erro') || syncMessage.includes('negada') || syncMessage.includes('Nenhuma') ? 'text-vc-danger-dark' : 'text-vc-secondary-dark'}`}>{syncMessage}</Text>}
        </Card>
      )}

      <DateNavigator label="Histórico de doses" onChange={setSelectedDate} selectedDate={selectedDate} />
      
      <View className="flex-row items-center justify-between"><Text className="text-lg font-bold text-vc-text-dark">Doses</Text>{administrations.isFetching && <ActivityIndicator color={colors.secondary} />}</View>
      {administrations.error && <Text className="text-sm text-vc-danger-dark">{administrations.error.message}</Text>}
      <ListFilters
        onOptionChange={setDoseStatus}
        onSearchChange={setDoseSearch}
        options={doseFilterOptions}
        placeholder="Buscar por medicamento, dose ou nota"
        resultCount={filteredAdministrations.length}
        search={doseSearch}
        selectedOption={doseStatus}
      />
      {!administrations.isFetching && !filteredAdministrations.length && <Card><Text className="text-sm text-vc-text-muted-dark">Nenhuma dose encontrada para os filtros.</Text></Card>}
      
      {filteredAdministrations.map((item) => {
        const completed = item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE';
        const skipped = item.status === 'SKIPPED';
        return (
          <Card className="gap-3" key={item._id}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-vc-accent-dark">
                {completed ? <Check color={colors.background} size={18} /> : skipped ? <XCircle color={colors.danger} size={18} /> : <Clock3 color={colors.primary} size={18} />}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-base font-bold text-vc-text-dark">{item.medicationSnapshot.name}</Text>
                <Text className="text-xs text-vc-text-muted-dark">{item.medicationSnapshot.dosageDescription}</Text>
                <Text className="text-sm font-bold text-vc-primary-dark">{new Date(item.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <StatusBadge label={statusLabel[item.status]} tone={completed ? 'success' : item.status === 'MISSED' ? 'danger' : item.status === 'SKIPPED' ? 'warning' : 'info'} />
            </View>
            {item.justification && <Text className="text-xs italic text-vc-text-muted-dark mt-1">Nota: {item.justification}</Text>}
            {item.status === 'PENDING' && <Button label="Gerenciar Dose" onPress={() => openActionModal(item)} variant="ghost" />}
          </Card>
        );
      })}

      <ModalSheet title="Gerenciar Dose" subtitle={selectedAdmin?.medicationSnapshot.name} visible={actionModalOpen} onClose={() => setActionModalOpen(false)}>
        <Input label="Justificativa (Atrasos e Ignorados)" placeholder="Ex: Acordei tarde..." value={justification} onChangeText={setJustification} />
        <View className="gap-3 mt-4">
          <Button label="Tomar no horário" loading={updateStatus.isPending} onPress={() => handleUpdateStatus('TAKEN_ON_TIME')} />
          <Button label="Tomar com atraso" loading={updateStatus.isPending} onPress={() => handleUpdateStatus('TAKEN_LATE')} variant="secondary" />
          <Button label="Ignorar dose" loading={updateStatus.isPending} onPress={() => handleUpdateStatus('SKIPPED')} variant="danger" />
        </View>
      </ModalSheet>
    </Screen>
  );
}
