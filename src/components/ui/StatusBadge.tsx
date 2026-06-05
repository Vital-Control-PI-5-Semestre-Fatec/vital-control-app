import { Text, View } from 'react-native';
import { cn } from '../../utils/cn';

type StatusTone = 'success' | 'warning' | 'danger' | 'info';

export function StatusBadge({ label, tone = 'info' }: { label: string; tone?: StatusTone }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', toneClasses[tone])}>
      <Text className="text-xs font-bold text-vc-bg-dark">{label}</Text>
    </View>
  );
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-vc-secondary-dark',
  warning: 'bg-vc-warning-dark',
  danger: 'bg-vc-danger-dark',
  info: 'bg-vc-primary-dark',
};
