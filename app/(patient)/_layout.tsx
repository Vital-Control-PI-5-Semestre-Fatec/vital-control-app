import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { PatientTabBar } from '../../src/components/navigation/PatientTabBar';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';
import { routeForRole } from '../../src/utils/role-routing';

export default function PatientLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-vc-bg-dark">
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== 'PATIENT') {
    return <Redirect href={routeForRole(session.user.role)} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <PatientTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="medications" options={{ title: 'Estoque' }} />
      <Tabs.Screen name="schedules" options={{ title: 'Rotinas' }} />
      <Tabs.Screen name="visits" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="profile" options={{ title: 'Ficha' }} />
      <Tabs.Screen name="account" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="visit-detail" options={{ href: null }} />
    </Tabs>
  );
}