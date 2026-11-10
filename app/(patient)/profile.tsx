import { HeartPulse, MapPin, PhoneCall, ShieldPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { usePatientProfile, useSavePatientProfile } from '../../src/features/patient/hooks';
import { formatCep, lookupCep } from '../../src/services/api/cep';
import { colors } from '../../src/theme/colors';

const emptyProfile = { bloodType: '', weightKg: '', heightCm: '', allergies: '', conditions: '', street: '', number: '', neighborhood: '', complement: '', city: '', state: '', zipCode: '', emergencyName: '', emergencyPhone: '' };

const formatNumber = (v: string) => v.replace(/[^\d.,]/g, '').replace(',', '.');

export default function ProfileScreen() {
  const profile = usePatientProfile();
  const saveProfile = useSavePatientProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProfile);
  const [error, setError] = useState<string>();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string>();

  useEffect(() => {
    const current = profile.data;
    if (current) setForm({ 
        bloodType: current.bloodType ?? '', weightKg: String(current.weightKg ?? ''), heightCm: String(current.heightCm ?? ''), 
        allergies: current.allergies.join(', '), conditions: current.preExistingConditions.join(', '), 
        street: current.defaultAddress?.street ?? '', number: current.defaultAddress?.number ?? '', 
        neighborhood: current.defaultAddress?.neighborhood ?? '', complement: current.defaultAddress?.complement ?? '', 
        city: current.defaultAddress?.city ?? '', state: current.defaultAddress?.state ?? '', zipCode: current.defaultAddress?.zipCode ?? '',
        emergencyName: current.emergencyContacts?.[0]?.name ?? '', emergencyPhone: current.emergencyContacts?.[0]?.phone ?? ''
    });
  }, [profile.data]);

  function save() {
    if (form.bloodType && !/^(A|B|AB|O)[+-]$/i.test(form.bloodType)) return setError('Tipo sanguíneo inválido. Ex.: O+, A-, AB+');
    saveProfile.mutate({ 
        bloodType: form.bloodType.toUpperCase() || undefined, weightKg: Number(form.weightKg) || undefined, heightCm: Number(form.heightCm) || undefined, 
        allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean), preExistingConditions: form.conditions.split(',').map((item) => item.trim()).filter(Boolean), 
        defaultAddress: form.street ? { street: form.street, number: form.number, neighborhood: form.neighborhood, complement: form.complement, city: form.city, state: form.state, zipCode: form.zipCode } : undefined, 
        emergencyContacts: form.emergencyName ? [{ name: form.emergencyName, phone: form.emergencyPhone }] : [],
        timezone: 'America/Sao_Paulo' 
    }, { onSuccess: () => setModalOpen(false), onError: (requestError) => setError(requestError.message) });
  }

  async function searchCep() {
    setCepError(undefined);
    setCepLoading(true);

    try {
      const address = await lookupCep(form.zipCode);
      setForm((current) => ({
        ...current,
        street: address.street || current.street,
        neighborhood: address.neighborhood || current.neighborhood,
        city: address.city || current.city,
        state: address.state || current.state,
        zipCode: address.zipCode,
      }));
    } catch (requestError) {
      setCepError(requestError instanceof Error ? requestError.message : 'Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <Screen title="Minha ficha" subtitle="Ficha centralizada de saúde e contato.">
      {profile.isFetching && <ActivityIndicator color={colors.secondary} />}
      {profile.error && <Text className="text-sm text-vc-danger-dark">{profile.error.message}</Text>}
      
      <Card className="gap-2"><View className="flex-row items-center gap-2"><HeartPulse color={colors.secondary} size={19} /><Text className="font-bold text-vc-text-dark">Dados de saúde</Text></View><Text className="text-sm text-vc-text-muted-dark">Sangue: {profile.data?.bloodType ?? 'Não informado'}</Text><Text className="text-sm text-vc-text-muted-dark">Peso: {profile.data?.weightKg ?? '-'} kg | Altura: {profile.data?.heightCm ?? '-'} cm</Text></Card>
      <Card className="gap-2"><View className="flex-row items-center gap-2"><ShieldPlus color={colors.secondary} size={19} /><Text className="font-bold text-vc-text-dark">Restrições</Text></View><Text className="text-sm text-vc-text-muted-dark">Alergias: {profile.data?.allergies.join(', ') || 'Nenhuma informada'}</Text><Text className="text-sm text-vc-text-muted-dark">Condições: {profile.data?.preExistingConditions.join(', ') || 'Nenhuma informada'}</Text></Card>
      <Card className="gap-2"><View className="flex-row items-center gap-2"><PhoneCall color={colors.danger} size={19} /><Text className="font-bold text-vc-text-dark">Emergência</Text></View><Text className="text-sm text-vc-text-muted-dark">{profile.data?.emergencyContacts?.[0]?.name ? `${profile.data.emergencyContacts[0].name} - ${profile.data.emergencyContacts[0].phone}` : 'Nenhum contato cadastrado'}</Text></Card>
      <Card className="gap-2"><View className="flex-row items-center gap-2"><MapPin color={colors.secondary} size={19} /><Text className="font-bold text-vc-text-dark">Endereço base</Text></View><Text className="text-sm text-vc-text-muted-dark">{profile.data?.defaultAddress ? `${profile.data.defaultAddress.street}, ${profile.data.defaultAddress.number} ${profile.data.defaultAddress.complement ? `(${profile.data.defaultAddress.complement})` : ''} - ${profile.data.defaultAddress.neighborhood}, ${profile.data.defaultAddress.city}` : 'Não informado'}</Text></Card>
      
      <Button label="Editar ficha" onPress={() => setModalOpen(true)} />
      
      <ModalSheet footer={<Button label="Salvar ficha" loading={saveProfile.isPending} onPress={save} />} onClose={() => setModalOpen(false)} title="Editar ficha" visible={modalOpen}>
        <Text className="font-bold text-vc-text-dark">Biotipo</Text>
        <View className="flex-row gap-2"><View className="flex-1"><Input label="Sanguineo" onChangeText={(v) => setForm({ ...form, bloodType: v })} value={form.bloodType} placeholder="Ex: O+" /></View><View className="flex-1"><Input label="Peso (kg)" keyboardType="decimal-pad" onChangeText={(v) => setForm({ ...form, weightKg: formatNumber(v) })} value={form.weightKg} /></View><View className="flex-1"><Input label="Altura (cm)" keyboardType="numeric" onChangeText={(v) => setForm({ ...form, heightCm: formatNumber(v) })} value={form.heightCm} /></View></View>
        <Input label="Alergias (vírgula)" onChangeText={(allergies) => setForm({ ...form, allergies })} value={form.allergies} /><Input label="Condições (vírgula)" onChangeText={(conditions) => setForm({ ...form, conditions })} value={form.conditions} />
        
        <Text className="font-bold text-vc-text-dark mt-4">Emergência</Text>
        <Input label="Nome" onChangeText={(emergencyName) => setForm({ ...form, emergencyName })} value={form.emergencyName} />
        <Input label="Telefone" onChangeText={(emergencyPhone) => setForm({ ...form, emergencyPhone })} value={form.emergencyPhone} />

        <Text className="font-bold text-vc-text-dark mt-4">Endereço</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input label="CEP" keyboardType="numeric" onChangeText={(v) => setForm({ ...form, zipCode: formatCep(v) })} value={form.zipCode} />
          </View>
          <View className="justify-end">
            <Button label="Buscar CEP" loading={cepLoading} onPress={searchCep} variant="ghost" />
          </View>
        </View>
        {cepError && <Text className="text-xs text-vc-danger-dark">{cepError}</Text>}
        <View className="flex-row gap-2"><View className="flex-[3]"><Input label="Rua" onChangeText={(street) => setForm({ ...form, street })} value={form.street} /></View><View className="flex-1"><Input label="Numero" onChangeText={(number) => setForm({ ...form, number })} value={form.number} /></View></View>
        <View className="flex-row gap-2"><View className="flex-1"><Input label="Bairro" onChangeText={(neighborhood) => setForm({ ...form, neighborhood })} value={form.neighborhood} /></View><View className="flex-1"><Input label="Comp." onChangeText={(complement) => setForm({ ...form, complement })} value={form.complement} /></View></View>
        <View className="flex-row gap-2"><View className="flex-1"><Input label="Cidade" onChangeText={(city) => setForm({ ...form, city })} value={form.city} /></View><View className="w-20"><Input label="UF" onChangeText={(state) => setForm({ ...form, state })} value={form.state} /></View></View>
        {error && <Text className="text-xs text-vc-danger-dark">{error}</Text>}
      </ModalSheet>
    </Screen>
  );
}
