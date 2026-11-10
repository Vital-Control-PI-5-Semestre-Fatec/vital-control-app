import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { RoleTabBar } from '../../src/components/navigation/RoleTabBar';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';

export default function CaregiverLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-vc-bg-dark"><ActivityIndicator color={colors.secondary} /></View>;
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.user.role !== 'CAREGIVER') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RoleTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="active" options={{ title: 'Andamento' }} />
      <Tabs.Screen name="account" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
