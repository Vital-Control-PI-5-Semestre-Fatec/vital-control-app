import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface InputProps extends ComponentProps<typeof TextInput> {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secureTextEntry, ...props }, ref) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = !!secureTextEntry;

    return (
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-vc-text-dark">{label}</Text>
        <View className="relative">
          <TextInput
            ref={ref}
            className={cn('min-h-12 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 text-vc-text-dark', isPassword && 'pr-12', error && 'border-vc-danger-dark')}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={isPassword && !passwordVisible}
            {...props}
          />
          {isPassword && (
            <Pressable
              accessibilityLabel={passwordVisible ? 'Esconder senha' : 'Mostrar senha'}
              className="absolute right-3 top-0 h-12 items-center justify-center"
              onPress={() => setPasswordVisible((current) => !current)}
            >
              {passwordVisible ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
            </Pressable>
          )}
        </View>
        {error && <Text className="text-xs text-vc-danger-dark">{error}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';
