import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Screen } from '../../src/components/ui/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { routeForRole } from '../../src/utils/role-routing';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

const darkLogo = require('../../assets/vital control dark logo.jpeg');
const lightLogo = require('../../assets/vital control ligth logo.jpeg');

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { session, login } = useAuth();
  const [error, setError] = useState<string>();
  const logo = colorScheme === 'dark' ? darkLogo : lightLogo;
  
  const passwordInputRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (session) {
    return <Redirect href={routeForRole(session.user.role)} />;
  }

  async function onSubmit(payload: LoginForm) {
    setError(undefined);
    try {
      await login(payload);
      router.replace('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível entrar.');
    }
  }

  return (
    <Screen scroll={false}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View className="items-center gap-2">
          <Image className="h-24 w-24 rounded-2xl" source={logo} />
          <Text className="text-2xl font-bold text-vc-text-dark">Bem-vindo de volta</Text>
          <Text className="text-center text-sm text-vc-text-muted-dark">Acompanhe sua rotina de cuidado com tranquilidade.</Text>
        </View>

        <View className="gap-3.5">
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value }, fieldState }) => (
              <Input
                autoCapitalize="none"
                error={fieldState.error?.message}
                keyboardType="email-address"
                label="E-mail"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="voce@exemplo.com"
                value={value}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value }, fieldState }) => (
              <Input
                ref={passwordInputRef}
                error={fieldState.error?.message}
                label="Senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Sua senha"
                secureTextEntry
                value={value}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
          {error && <Text className="text-sm text-vc-danger-dark">{error}</Text>}
          <Button label="Entrar" loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)} />
        </View>

        <Text className="text-center text-vc-text-muted-dark">
          Ainda não possui conta? <Link className="font-bold text-vc-secondary-dark" href="/(auth)/register">Criar conta</Link>
        </Text>
      </KeyboardAwareScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 32,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
});
