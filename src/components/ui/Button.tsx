import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ComponentProps<typeof Pressable> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

export function Button({ label, variant = 'primary', loading, disabled, className, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      className={cn('min-h-12 items-center justify-center rounded-xl px-4 active:opacity-80', variantClasses[variant], (disabled || loading) && 'opacity-50', className)}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.secondary : colors.background} />
      ) : (
        <Text className={cn('text-sm font-bold text-vc-bg-dark', variant === 'ghost' && 'text-vc-secondary-dark')}>{label}</Text>
      )}
    </Pressable>
  );
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-vc-secondary-dark',
  secondary: 'bg-vc-primary-dark',
  ghost: 'border border-vc-border-dark bg-transparent',
  danger: 'bg-vc-danger-dark',
};
