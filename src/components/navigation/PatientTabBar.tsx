import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, FileHeart, Home, PackagePlus, Repeat2, UserRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

const icons: Record<string, LucideIcon> = {
  index: Home,
  medications: PackagePlus,
  schedules: Repeat2,
  visits: CalendarDays,
  profile: FileHeart,
  account: UserRound,
};

export function PatientTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView className="border-t border-vc-border-dark bg-vc-surface-dark" edges={['bottom']}>
      <View className="flex-row pb-2 pt-2">
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          
          // BLOQUEIO DEFINITIVO: Impede que a tela de detalhes apareça na barra, 
          // independentemente de como o arquivo esteja nomeado ou do cache.
          if (route.name === 'visit-detail' || route.name === 'visit_detail') return null;
          if ((options as { href?: string | null }).href === null) return null;

          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = icons[route.name] || Home;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              className="flex-1 items-center gap-1 py-1 active:opacity-70"
              onPress={() => navigation.navigate(route.name, route.params)}
            >
              <Icon color={focused ? colors.secondary : colors.textMuted} size={21} />
              <Text className={cn('text-[11px] font-semibold', focused ? 'text-vc-secondary-dark' : 'text-vc-text-muted-dark')}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
