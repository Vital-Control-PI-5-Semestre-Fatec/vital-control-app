import { CheckCircle2, Download, FileText, Info, ShieldCheck, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import {
  exportMyData,
  fetchMyConsents,
  fetchPrivacyPolicy,
  recordConsent,
  submitDataRequest,
} from './api';
import type { PrivacyPolicyDoc, UserConsent } from './types';

const DEFAULT_PURPOSES = [
  {
    key: 'TRATAMENTO_DADOS_SAUDE',
    title: 'Monitoramento Clínico e Lembretes',
    description: 'Tratamento de dados de saúde (medicamentos, alergias, rotinas) para emissão de alertas e apoio ao cuidado.',
  },
  {
    key: 'COMPARTILHAMENTO_CUIDADOR',
    title: 'Compartilhamento em Rede de Cuidado',
    description: 'Acesso do prontuário por cuidadores e gestores estritamente vinculados ao seu grupo de cuidado.',
  },
];

export function LgpdPrivacyCard() {
  const { session } = useAuth();
  const token = session?.accessToken;

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const [policy, setPolicy] = useState<PrivacyPolicyDoc | null>(null);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportedData, setExportedData] = useState<Record<string, unknown> | null>(null);

  // Form de solicitação
  const [requestType, setRequestType] = useState<'CORRECTION' | 'DELETION'>('CORRECTION');
  const [requestDetails, setRequestDetails] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string>();

  useEffect(() => {
    if (token) {
      void loadConsents();
    }
  }, [token]);

  async function loadConsents() {
    if (!token) return;
    try {
      const data = await fetchMyConsents(token);
      setConsents(data);
    } catch {
      // Falha silenciosa
    }
  }

  async function openPolicy() {
    setPolicyModalOpen(true);
    if (!policy) {
      setLoading(true);
      try {
        const doc = await fetchPrivacyPolicy();
        setPolicy(doc);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleToggleConsent(purpose: string, currentConsented: boolean) {
    if (!token) return;
    setLoading(true);
    try {
      await recordConsent(token, {
        purpose,
        consented: !currentConsented,
      });
      await loadConsents();
    } catch {
      // Ignora erro
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    if (!token) return;
    setLoading(true);
    setExportModalOpen(true);
    try {
      const data = await exportMyData(token);
      setExportedData(data);
    } catch {
      // Erro
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!token || !requestDetails.trim()) {
      setRequestError('Informe os detalhes da solicitação.');
      return;
    }
    setRequestError(undefined);
    setLoading(true);
    try {
      await submitDataRequest(token, {
        requestType,
        details: requestDetails.trim(),
      });
      setRequestSuccess(true);
      setRequestDetails('');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <ShieldCheck color={colors.secondary} size={20} />
        <View className="flex-1">
          <Text className="text-sm font-bold text-vc-text-dark">Privacidade e LGPD</Text>
          <Text className="mt-0.5 text-xs text-vc-text-muted-dark">Seus direitos e controle de dados pessoais (Lei 13.709/18)</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 rounded-xl bg-vc-surface-dark border border-vc-border-dark p-2.5">
        <Info color={colors.primary} size={16} />
        <Text className="flex-1 text-[11px] text-vc-text-muted-dark leading-4">
          Você tem controle total sobre seus dados. Acesse a política, exporte seu dossiê ou revogue consentimentos.
        </Text>
      </View>

      <Button label="Política de Privacidade" onPress={openPolicy} variant="ghost" />
      <Button label="Gerenciar Consentimentos" onPress={() => setConsentModalOpen(true)} variant="ghost" />
      <Button label="Exportar Meus Dados (Art. 18)" onPress={handleExportData} variant="ghost" />
      <Button
        label="Solicitar Correção ou Exclusão"
        onPress={() => {
          setRequestSuccess(false);
          setRequestError(undefined);
          setRequestModalOpen(true);
        }}
        variant="ghost"
      />

      {/* Modal 1: Política de Privacidade (RF03) */}
      <ModalSheet onClose={() => setPolicyModalOpen(false)} title="Política de Privacidade (LGPD)" visible={policyModalOpen}>
        {loading && !policy ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <ScrollView className="max-h-[70vh] gap-3">
            <Text className="text-xs font-bold text-vc-text-dark">{policy?.title ?? 'Política de Privacidade'}</Text>
            <Text className="text-[11px] text-vc-text-muted-dark leading-5">{policy?.summary}</Text>

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Dados Coletados e Finalidades:</Text>
            {policy?.collectedData.map((c, i) => (
              <View className="rounded-lg border border-vc-border-dark p-2.5 gap-1" key={i}>
                <Text className="text-xs font-semibold text-vc-primary-dark">{c.category}</Text>
                <Text className="text-[11px] text-vc-text-dark">Campos: {c.fields.join(', ')}</Text>
                <Text className="text-[10px] text-vc-text-muted-dark">Finalidade: {c.purpose}</Text>
              </View>
            ))}

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Direitos do Titular (Art. 18 LGPD):</Text>
            {policy?.dataSubjectRights.map((r, i) => (
              <Text className="text-[11px] text-vc-text-muted-dark" key={i}>• {r}</Text>
            ))}

            <Text className="mt-2 text-[11px] text-vc-text-muted-dark">Contato DPO: {policy?.dpoContact.email}</Text>
          </ScrollView>
        )}
      </ModalSheet>

      {/* Modal 2: Gerenciar Consentimentos (RF01) */}
      <ModalSheet onClose={() => setConsentModalOpen(false)} title="Consentimentos e Revogação" visible={consentModalOpen}>
        <View className="gap-3">
          <Text className="text-xs text-vc-text-muted-dark">
            Em conformidade com o Art. 8º da LGPD, você pode revogar ou conceder consentimentos a qualquer momento.
          </Text>

          {DEFAULT_PURPOSES.map((p) => {
            const consentItem = consents.find((c) => c.purpose === p.key);
            const isConsented = consentItem ? consentItem.consented : true;

            return (
              <View className="rounded-xl border border-vc-border-dark p-3 gap-2 bg-vc-surface-dark" key={p.key}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-vc-text-dark flex-1">{p.title}</Text>
                  <View className="flex-row items-center gap-1">
                    {isConsented ? (
                      <CheckCircle2 color={colors.secondary} size={15} />
                    ) : (
                      <XCircle color={colors.danger} size={15} />
                    )}
                    <Text className={`text-[11px] font-semibold ${isConsented ? 'text-vc-secondary-dark' : 'text-vc-danger-dark'}`}>
                      {isConsented ? 'Autorizado' : 'Revogado'}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-vc-text-muted-dark">{p.description}</Text>

                <Button
                  label={isConsented ? 'Revogar Consentimento' : 'Conceder Consentimento'}
                  onPress={() => handleToggleConsent(p.key, isConsented)}
                  variant={isConsented ? 'danger' : 'primary'}
                />
              </View>
            );
          })}
        </View>
      </ModalSheet>

      {/* Modal 3: Exportar Meus Dados (RF02) */}
      <ModalSheet onClose={() => setExportModalOpen(false)} title="Exportação de Dados (Art. 18)" visible={exportModalOpen}>
        {loading && !exportedData ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <ScrollView className="max-h-[60vh] gap-2">
            <View className="flex-row items-center gap-2">
              <Download color={colors.secondary} size={18} />
              <Text className="text-xs font-bold text-vc-text-dark">Dossiê Completo de Titular Gerado</Text>
            </View>
            <Text className="text-[11px] text-vc-text-muted-dark">
              Seus dados foram reunidos de forma estruturada para garantir seu direito de portabilidade e acesso (Art. 18, II e V da LGPD).
            </Text>
            <View className="rounded-lg bg-black/40 p-3 border border-vc-border-dark">
              <Text className="font-mono text-[10px] text-green-400">
                {JSON.stringify(exportedData, null, 2)}
              </Text>
            </View>
          </ScrollView>
        )}
      </ModalSheet>

      {/* Modal 4: Solicitar Correção ou Exclusão (RF02) */}
      <ModalSheet
        footer={<Button label="Enviar Solicitação" onPress={handleSendRequest} />}
        onClose={() => setRequestModalOpen(false)}
        title="Solicitação de Titular (LGPD)"
        visible={requestModalOpen}
      >
        <View className="gap-3">
          <Text className="text-xs text-vc-text-muted-dark">
            Abra uma solicitação formal para exercer seus direitos de retificação ou exclusão de dados pessoais.
          </Text>

          <View className="flex-row gap-2">
            <Button
              label="Correção de Dados"
              onPress={() => setRequestType('CORRECTION')}
              variant={requestType === 'CORRECTION' ? 'primary' : 'ghost'}
            />
            <Button
              label="Exclusão de Conta"
              onPress={() => setRequestType('DELETION')}
              variant={requestType === 'DELETION' ? 'danger' : 'ghost'}
            />
          </View>

          <Input
            label="Detalhes da solicitação"
            multiline
            numberOfLines={4}
            onChangeText={setRequestDetails}
            placeholder="Descreva o que deseja corrigir ou o motivo do cancelamento"
            value={requestDetails}
          />

          {requestSuccess && (
            <Text className="text-xs text-vc-secondary-dark">
              ✓ Sua solicitação foi protocolada e registrada na trilha de auditoria do sistema.
            </Text>
          )}
          {requestError && <Text className="text-xs text-vc-danger-dark">{requestError}</Text>}
        </View>
      </ModalSheet>
    </Card>
  );
}

