import { useRouter } from 'expo-router';
import { Bell, LockKeyhole, LogOut, Smartphone, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { Screen } from '../../components/ui/Screen';
import { useNotificationDevices } from '../patient/hooks';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { UserRole } from '../../types/auth';

const roleLabels: Record<UserRole, string> = {
  PATIENT: 'Paciente',
  CAREGIVER: 'Cuidador',
  CARE_MANAGER: 'Gerente de cuidado',
  RESPONSIBLE: 'Responsável',
};

export function SharedAccountScreen() {
  const router = useRouter();
  const { session, changePassword, logout, updateUser } = useAuth();
  const devices = useNotificationDevices();
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [name, setName] = useState(session?.user.name ?? '');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [passwordSaved, setPasswordSaved] = useState(false);

  function openEdit() {
    setName(session?.user.name ?? '');
    setEmail(session?.user.email ?? '');
    setError(undefined);
    setModalOpen(true);
  }

  async function saveProfile() {
    if (!name.trim() || !email.trim()) {
      setError('Preencha nome e e-mail.');
      return;
    }

    await updateUser({ name: name.trim(), email: email.trim() });
    setModalOpen(false);
  }

  function openPasswordModal() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(undefined);
    setPasswordSaved(false);
    setPasswordModalOpen(true);
  }

  async function savePassword() {
    setPasswordError(undefined);
    setPasswordSaved(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos de senha.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setPasswordError(requestError instanceof Error ? requestError.message : 'Não foi possível alterar a senha.');
    }
  }

  async function signOut() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen title="Perfil" subtitle="Dados da conta e dispositivos vinculados.">
      <View className="items-center gap-1 py-2">
        <Image className="h-20 w-20 rounded-2xl" source={require('../../../assets/vital control dark logo.jpeg')} />
        <Text className="text-xl font-bold text-vc-text-dark">{session?.user.name}</Text>
        <Text className="text-sm text-vc-text-muted-dark">{session?.user.email}</Text>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <UserRound color={colors.secondary} size={19} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-vc-text-dark">Dados da conta</Text>
            <Text className="mt-1 text-xs text-vc-text-muted-dark">Perfil: {session?.user.role ? roleLabels[session.user.role] : '-'}</Text>
          </View>
        </View>
        <Button label="Editar perfil" onPress={openEdit} variant="ghost" />
        <Button label="Trocar senha" onPress={openPasswordModal} variant="ghost" />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <Bell color={colors.secondary} size={19} />
          <View>
            <Text className="text-sm font-bold text-vc-text-dark">Dispositivos</Text>
            <Text className="mt-1 text-xs text-vc-text-muted-dark">Notificações vinculadas a esta conta</Text>
          </View>
        </View>
        {devices.error && <Text className="text-xs text-vc-danger-dark">{devices.error.message}</Text>}
        {(devices.data ?? []).map((device) => (
          <View className="flex-row items-center gap-2 border-t border-vc-border-dark pt-3" key={device._id}>
            <Smartphone color={colors.primary} size={16} />
            <Text className="text-xs text-vc-text-muted-dark">{device.deviceName || device.platform}</Text>
          </View>
        ))}
        {!devices.isFetching && !devices.data?.length && <Text className="text-xs text-vc-text-muted-dark">Nenhum dispositivo registrado.</Text>}
      </Card>

      <Button label="Sair da conta" onPress={signOut} variant="danger" />
      <View className="flex-row items-center justify-center gap-1.5">
        <LogOut color={colors.textMuted} size={15} />
        <Text className="text-xs text-vc-text-muted-dark">Sua sessão segura será removida deste dispositivo.</Text>
      </View>

      <ModalSheet footer={<Button label="Salvar perfil" onPress={saveProfile} />} onClose={() => setModalOpen(false)} title="Editar perfil" visible={modalOpen}>
        <Input label="Nome" onChangeText={setName} value={name} />
        <Input autoCapitalize="none" keyboardType="email-address" label="E-mail" onChangeText={setEmail} value={email} />
        {error && <Text className="text-xs text-vc-danger-dark">{error}</Text>}
      </ModalSheet>

      <ModalSheet footer={<Button label="Atualizar senha" onPress={savePassword} />} onClose={() => setPasswordModalOpen(false)} title="Trocar senha" subtitle="Use uma senha forte para manter sua conta protegida." visible={passwordModalOpen}>
        <View className="flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-dark p-3">
          <LockKeyhole color={colors.secondary} size={18} />
          <Text className="flex-1 text-xs leading-5 text-vc-text-muted-dark">Por segurança, informe sua senha atual antes de definir a nova.</Text>
        </View>
        <Input label="Senha atual" onChangeText={setCurrentPassword} secureTextEntry value={currentPassword} />
        <Input label="Nova senha" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
        <Input label="Confirmar nova senha" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
        {passwordSaved && <Text className="text-xs text-vc-secondary-dark">Senha atualizada com sucesso.</Text>}
        {passwordError && <Text className="text-xs text-vc-danger-dark">{passwordError}</Text>}
      </ModalSheet>
    </Screen>
  );
}
