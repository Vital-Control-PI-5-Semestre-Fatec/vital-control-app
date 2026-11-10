import { Link, useRouter } from 'expo-router';
import { HeartPulse, ShieldCheck, Stethoscope, UsersRound, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Screen } from '../../src/components/ui/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';
import type { RegisterPayload, UserRole } from '../../src/types/auth';
import { cn } from '../../src/utils/cn';
import { routeForRole } from '../../src/utils/role-routing';

const roles: Array<{ value: UserRole; label: string; description: string; icon: LucideIcon }> = [
  { value: 'PATIENT', label: 'Paciente', description: 'Minha rotina e medicamentos', icon: HeartPulse },
  { value: 'CAREGIVER', label: 'Cuidador', description: 'Atendimentos e visitas', icon: Stethoscope },
  { value: 'CARE_MANAGER', label: 'Gerente', description: 'Grupos e operação', icon: ShieldCheck },
  { value: 'RESPONSIBLE', label: 'Responsável', description: 'Acompanhar familiares', icon: UsersRound },
];

const darkLogo = require('../../assets/vital control dark logo.jpeg');
const lightLogo = require('../../assets/vital control ligth logo.jpeg');

interface RegisterFormValues extends Omit<RegisterPayload, 'name'> {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { register } = useAuth();
  const [apiError, setApiError] = useState<string>();
  const logo = colorScheme === 'dark' ? darkLogo : lightLogo;

  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'PATIENT',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setApiError(undefined);

    try {
      await register({
        name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
        email: values.email,
        password: values.password,
        role: values.role,
      });
      router.replace(routeForRole(values.role));
    } catch (requestError) {
      setApiError(requestError instanceof Error ? requestError.message : 'Não foi possível criar a conta.');
    }
  }

  return (
    <Screen scroll={false}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
          <View className="items-center gap-3">
            <Image className="h-16 w-16 rounded-2xl" source={logo} />
            <View className="gap-1.5">
              <Text className="text-center text-2xl font-bold text-vc-text-dark">Criar conta</Text>
              <Text className="text-center text-sm leading-5 text-vc-text-muted-dark">Informe seus dados para entrar no Vital Control.</Text>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-vc-text-dark">Tipo de perfil</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-3">
                  {roles.map((option) => {
                    const selected = value === option.value;
                    const Icon = option.icon;

                    return (
                      <Pressable
                        className={cn(
                          'min-h-[112px] flex-1 basis-[46%] rounded-2xl border p-3 active:opacity-80',
                          selected ? 'border-vc-secondary-dark bg-vc-surface-raised-dark' : 'border-vc-border-dark bg-vc-surface-dark',
                        )}
                        key={option.value}
                        onPress={() => onChange(option.value)}
                      >
                        <View className="gap-3">
                          <View className={cn('h-10 w-10 items-center justify-center rounded-2xl', selected ? 'bg-vc-secondary-dark' : 'bg-vc-bg-dark')}>
                            <Icon color={selected ? colors.background : colors.secondary} size={20} />
                          </View>
                          <View className="gap-1">
                            <Text className="text-sm font-bold text-vc-text-dark">{option.label}</Text>
                            <Text className="text-xs leading-4 text-vc-text-muted-dark">{option.description}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View className="gap-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="firstName"
                  rules={{ required: 'Informe seu nome.' }}
                  render={({ field: { onBlur, onChange, value }, fieldState }) => (
                    <Input
                      blurOnSubmit={false}
                      error={fieldState.error?.message}
                      label="Nome"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      onSubmitEditing={() => lastNameInputRef.current?.focus()}
                      placeholder="Seu nome"
                      returnKeyType="next"
                      value={value}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="lastName"
                  rules={{ required: 'Informe seu sobrenome.' }}
                  render={({ field: { onBlur, onChange, value }, fieldState }) => (
                    <Input
                      blurOnSubmit={false}
                      error={fieldState.error?.message}
                      label="Sobrenome"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      placeholder="Sobrenome"
                      ref={lastNameInputRef}
                      returnKeyType="next"
                      value={value}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Informe seu e-mail.',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Informe um e-mail válido.',
                },
              }}
              render={({ field: { onBlur, onChange, value }, fieldState }) => (
                <Input
                  autoCapitalize="none"
                  blurOnSubmit={false}
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  label="E-mail"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  placeholder="voce@exemplo.com"
                  ref={emailInputRef}
                  returnKeyType="next"
                  value={value}
                />
              )}
            />
          </View>

          <View className="gap-3">
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Informe uma senha.',
                minLength: {
                  value: 8,
                  message: 'A senha deve ter pelo menos 8 caracteres.',
                },
              }}
              render={({ field: { onBlur, onChange, value }, fieldState }) => (
                <Input
                  blurOnSubmit={false}
                  error={fieldState.error?.message}
                  label="Senha"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  placeholder="Pelo menos 8 caracteres"
                  ref={passwordInputRef}
                  returnKeyType="next"
                  secureTextEntry
                  value={value}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Confirme sua senha.',
                validate: (value, formValues) => value === formValues.password || 'As senhas não coincidem.',
              }}
              render={({ field: { onBlur, onChange, value }, fieldState }) => (
                <Input
                  error={fieldState.error?.message}
                  label="Confirmar senha"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={handleSubmit(onSubmit)}
                  placeholder="Digite a senha novamente"
                  ref={confirmPasswordInputRef}
                  returnKeyType="done"
                  secureTextEntry
                  value={value}
                />
              )}
            />
            <Text className="-mt-1 text-xs text-vc-text-muted-dark">Use pelo menos 8 caracteres.</Text>
          </View>

          {apiError && <Text className="text-sm text-vc-danger-dark">{apiError}</Text>}

          <Button
            className="mt-2"
            label="Cadastrar"
            loading={formState.isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />

          <Text className="text-center text-vc-text-muted-dark mt-2">
            Já possui conta? <Link className="font-bold text-vc-secondary-dark" href="/(auth)/login">Entrar</Link>
          </Text>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 20,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  scroll: {
    flex: 1,
  },
});
