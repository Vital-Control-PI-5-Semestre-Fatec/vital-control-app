import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../../utils/cn';

interface CardProps extends PropsWithChildren<ViewProps> {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return <View className={cn('rounded-2xl border border-vc-border-dark bg-vc-surface-dark p-4', className)} {...props} />;
}
