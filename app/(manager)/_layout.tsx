import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { RoleTabBar } from '../../src/components/navigation/RoleTabBar';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';

export default function ManagerLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-vc-bg-dark"><ActivityIndicator color={colors.secondary} /></View>;
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.user.role !== 'CARE_MANAGER') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RoleTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="requests" options={{ title: 'Triagem' }} />
      <Tabs.Screen name="groups" options={{ title: 'Grupos' }} />
      <Tabs.Screen name="account" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="group-detail" options={{ href: null }} />
      <Tabs.Screen name="visit-detail" options={{ href: null }} />
    </Tabs>
  );
}
