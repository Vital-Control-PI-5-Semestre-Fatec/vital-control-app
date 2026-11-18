import { CheckCircle2, Circle, HeartPulse, MapPin, PhoneCall, ShieldCheck, ShieldPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { recordConsent } from '../../src/features/lgpd/api';
import { usePatientProfile, useSavePatientProfile } from '../../src/features/patient/hooks';
import { useAuth } from '../../src/providers/AuthProvider';
import { formatCep, lookupCep } from '../../src/services/api/cep';
import { colors } from '../../src/theme/colors';

const emptyProfile = { bloodType: '', weightKg: '', heightCm: '', allergies: '', conditions: '', street: '', number: '', neighborhood: '', complement: '', city: '', state: '', zipCode: '', emergencyName: '', emergencyPhone: '' };

const formatNumber = (v: string) => v.replace(/[^\d.,]/g, '').replace(',', '.');

export default function ProfileScreen() {
  const { session } = useAuth();
  const profile = usePatientProfile();
  const saveProfile = useSavePatientProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProfile);
  const [error, setError] = useState<string>();
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string>();
  const [sensitiveConsent, setSensitiveConsent] = useState(true);

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
    setError(undefined);
    if (!sensitiveConsent) {
      setError('É obrigatório confirmar o consentimento para tratamento de dados sensíveis de saúde.');
      return;
    }
    if (form.bloodType && !/^(A|B|AB|O)[+-]$/i.test(form.bloodType)) {
      setError('Tipo sanguíneo inválido. Ex.: O+, A-, AB+');
      return;
    }

    saveProfile.mutate(
      {
        bloodType: form.bloodType.toUpperCase() || undefined,
        weightKg: Number(form.weightKg) || undefined,
        heightCm: Number(form.heightCm) || undefined,
        allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        preExistingConditions: form.conditions.split(',').map((item) => item.trim()).filter(Boolean),
        defaultAddress: form.street
          ? {
              street: form.street,
              number: form.number,
              neighborhood: form.neighborhood,
              complement: form.complement,
              city: form.city,
              state: form.state,
              zipCode: form.zipCode,
            }
          : undefined,
        emergencyContacts: form.emergencyName
          ? [{ name: form.emergencyName, phone: form.emergencyPhone }]
          : [],
        timezone: 'America/Sao_Paulo',
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          if (session?.accessToken) {
            void recordConsent(session.accessToken, {
              purpose: 'FICHA_CLINICA_DADOS_SENSIVEIS',
              consented: true,
              version: '1.0.0',
            });
          }
        },
        onError: (requestError) => setError(requestError.message),
      },
    );
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
      <View className="flex-row items-center gap-1.5 self-start bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mb-1">
        <ShieldCheck color="#10b981" size={13} />
        <Text className="text-[11px] font-bold text-emerald-400">
          Ficha clínica protegida sob a LGPD (Art. 11 - Dados Sensíveis)
        </Text>
      </View>

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
        
        {/* Consentimento para Dados Sensíveis de Saúde (Art. 11 LGPD) */}
        <View className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3.5 gap-2 mt-2">
          <View className="flex-row items-center gap-2">
            <ShieldCheck color="#0284c7" size={17} />
            <Text className="text-xs font-bold text-sky-400">
              Consentimento de Dados Sensíveis (Art. 11 LGPD)
            </Text>
          </View>
          <Text className="text-[11px] text-vc-text-dark leading-4">
            Biotipo, alergias e condições pré-existentes são dados sensíveis de saúde protegidos pela LGPD. Eles são tratados com sigilo exclusivamente para apoio clínico, emissão de alertas e socorro em emergências.
          </Text>
          <Pressable
            className="flex-row items-center gap-2 pt-1 active:opacity-80"
            onPress={() => setSensitiveConsent(!sensitiveConsent)}
          >
            {sensitiveConsent ? (
              <CheckCircle2 color={colors.secondary} size={18} />
            ) : (
              <Circle color={colors.danger} size={18} />
            )}
            <Text className="text-xs font-semibold text-vc-text-dark flex-1">
              Consinto com o tratamento e armazenamento seguro dos meus dados clínicos e restrições.
            </Text>
          </Pressable>
        </View>

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
