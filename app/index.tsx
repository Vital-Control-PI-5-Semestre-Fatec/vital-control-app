import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/providers/AuthProvider';
import { colors } from '../src/theme/colors';
import { routeForRole } from '../src/utils/role-routing';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-vc-bg-dark">
        <ActivityIndicator color={colors.secondary} size="large" />
      </View>
    );
  }

  return <Redirect href={session ? routeForRole(session.user.role) : '/(auth)/login'} />;
}
