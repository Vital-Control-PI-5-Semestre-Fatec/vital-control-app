import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  scroll?: boolean;
}

export function Screen({ title, subtitle, action, scroll = true, children }: ScreenProps) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }

  const content = (
    <View className="flex-1 gap-4 p-5">
      {(title || subtitle || action) && (
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-1">
            {title && <Text className="text-2xl font-bold text-vc-text-dark">{title}</Text>}
            {subtitle && <Text className="text-sm leading-5 text-vc-text-muted-dark">{subtitle}</Text>}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-vc-bg-dark">
      {scroll ? (
        <ScrollView
          contentContainerClassName="flex-grow"
          refreshControl={<RefreshControl colors={[colors.secondary]} onRefresh={refresh} refreshing={refreshing} tintColor={colors.secondary} />}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}
