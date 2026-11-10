import { useEffect, useState } from 'react';
import { ActivityIndicator, Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, Users, Wifi, WifiOff } from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/providers/AuthProvider';
import { patientApi } from '../../src/features/patient/api';
import { operationsApi } from '../../src/features/operations/api';
import {
  requestNotificationPermission,
  syncAllAlarms,
  getPushToken,
} from '../../src/services/notifications';
import { getQueue } from '../../src/services/offline/queue';
import { colors } from '../../src/theme/colors';

export default function ResponsibleNotificationsScreen() {
  const { session } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');

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

  useEffect(() => {
    void (async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (granted) {
        setNotificationsEnabled(true);
        const token = await getPushToken();
        setPushToken(token);
      }
      const queue = await getQueue();
      setPendingCount(queue.length);
    })();
  }, []);

  async function handleToggleNotifications(value: boolean) {
    setNotificationsEnabled(value);
    if (!value) {
    setSyncMessage('');
    return;
}
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) {
      setNotificationsEnabled(false);
      setSyncMessage('Permissão negada. Ative nas configurações do dispositivo.');
    }
  }

  async function handleSyncAlarms() {
    if (!schedulesQuery.data) {
    setSyncMessage('Nenhuma rotina encontrada para sincronizar.');
     return;
}
    setSyncing(true);
    setSyncMessage('');
    try {
      await syncAllAlarms(schedulesQuery.data);
      const active = schedulesQuery.data.filter((s) => s.active).length;
      setSyncMessage(`${active} alarme(s) sincronizado(s) com sucesso.`);
    } catch {
      setSyncMessage('Erro ao sincronizar alarmes.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Screen title="Notificações" subtitle="Gerencie lembretes e status offline do app.">

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {notificationsEnabled
              ? <Bell color={colors.secondary} size={20} />
              : <BellOff color={colors.textMuted} size={20} />}
            <View>
              <Text className="text-sm font-bold text-vc-text-dark">Lembretes de medicamento</Text>
              <Text className="text-xs text-vc-text-muted-dark">
                {permissionGranted === false
                  ? 'Permissão negada'
                  : notificationsEnabled
                  ? 'Ativado'
                  : 'Desativado'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: colors.secondary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>

        {notificationsEnabled && (
          <>
            <View className="h-px bg-vc-border-dark" />
            <View className="gap-2">
              <Text className="text-xs font-semibold text-vc-text-muted-dark uppercase">
                Alarmes das rotinas do paciente
              </Text>
              {schedulesQuery.isLoading && <ActivityIndicator color={colors.secondary} size="small" />}
              {!patientId && !schedulesQuery.isLoading && (
                <View className="flex-row items-center gap-4 py-2">
                  <Users color={colors.textMuted} size={24} />
                  <Text className="text-xs text-vc-text-muted-dark flex-1">
                    Nenhum paciente vinculado. Os alarmes serão configurados após o vínculo.
                  </Text>
                </View>
              )}
              {schedulesQuery.data && (
                <Text className="text-xs text-vc-text-muted-dark">
                  {schedulesQuery.data.filter((s) => s.active).length} rotina(s) ativa(s) encontrada(s).
                </Text>
              )}
              <Button
                label={syncing ? 'Sincronizando...' : 'Sincronizar alarmes agora'}
                loading={syncing}
                onPress={handleSyncAlarms}
                variant="ghost"
              />
              {!!syncMessage && (
                <Text className={`text-xs ${syncMessage.includes('Nenhuma') || syncMessage.includes('Erro') ? 'text-vc-danger-dark' : 'text-vc-secondary-dark'}`}>{syncMessage}</Text>
              )}
            </View>
          </>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          {pendingCount > 0
            ? <WifiOff color={colors.warning} size={20} />
            : <Wifi color={colors.secondary} size={20} />}
          <View className="flex-1">
            <Text className="text-sm font-bold text-vc-text-dark">Fila offline</Text>
            <Text className="text-xs text-vc-text-muted-dark">
              {pendingCount > 0
                ? `${pendingCount} ação(ões) pendente(s) de sincronização.`
                : 'Todas as ações foram sincronizadas.'}
            </Text>
          </View>
        </View>
        {pendingCount > 0 && (
          <Text className="text-xs text-vc-danger-dark">
            As ações serão enviadas automaticamente quando a conexão voltar.
          </Text>
        )}
      </Card>

      {pushToken && (
        <Card className="gap-1">
          <Text className="text-xs font-semibold text-vc-text-muted-dark uppercase">Token de notificação</Text>
          <Text className="text-xs text-vc-text-muted-dark" numberOfLines={2}>{pushToken}</Text>
        </Card>
      )}

    </Screen>
  );
}