import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Bell,
  Calendar,
  ClipboardList,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  Pill,
  Repeat2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

const icons: Record<string, LucideIcon> = {
  index: LayoutDashboard,
  active: ListChecks,
  requests: ClipboardList,
  groups: UsersRound,
  account: UserRound,
  detail: HeartHandshake,
  'visit-detail': HeartHandshake,
  'group-detail': FolderKanban,
  medications: Pill,
  schedules: Repeat2,
  visits: Calendar,
  notifications: Bell,
};

const hiddenRoutes = new Set(['group-detail', 'group_detail', 'visit-detail', 'visit_detail']);

export function RoleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView className="border-t border-vc-border-dark bg-vc-surface-dark" edges={['bottom']}>
      <View className="flex-row pb-2 pt-2">
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          if (hiddenRoutes.has(route.name)) return null;
          if ((options as { href?: string | null }).href === null) return null;

          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = icons[route.name] ?? LayoutDashboard;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              className="flex-1 items-center gap-1 py-1 active:opacity-70"
              key={route.key}
              onPress={() => navigation.navigate(route.name, route.params)}
            >
              <Icon color={focused ? colors.secondary : colors.textMuted} size={21} />
              <Text
                className={cn(
                  'text-[11px] font-semibold',
                  focused ? 'text-vc-secondary-dark' : 'text-vc-text-muted-dark',
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
