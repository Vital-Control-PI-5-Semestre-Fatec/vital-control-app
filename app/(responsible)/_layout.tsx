import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { RoleTabBar } from '../../src/components/navigation/RoleTabBar';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';

export default function ResponsibleLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-vc-bg-dark">
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.user.role !== 'RESPONSIBLE') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RoleTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="medications" options={{ title: 'Medicamentos' }} />
      <Tabs.Screen name="schedules" options={{ title: 'Rotinas' }} />
      <Tabs.Screen name="visits" options={{ title: 'Atendimentos' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Tabs.Screen name="account" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
