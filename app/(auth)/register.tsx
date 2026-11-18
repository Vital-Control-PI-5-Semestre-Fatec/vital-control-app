import { Link, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  HeartPulse,
  Info,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { fetchPrivacyPolicy } from '../../src/features/lgpd/api';
import type { PrivacyPolicyDoc } from '../../src/features/lgpd/types';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme/colors';
import type { RegisterPayload, UserRole } from '../../src/types/auth';
import { cn } from '../../src/utils/cn';
import { routeForRole } from '../../src/utils/role-routing';

interface RoleDefinition {
  value: UserRole;
  label: string;
  badge: string;
  shortDescription: string;
  fullDescription: string;
  targetAudience: string;
  icon: LucideIcon;
  features: string[];
}

interface ProfileConsentItem {
  key: string;
  label: string;
  required: boolean;
  hint: string;
}

const roleConsentsMap: Record<UserRole, ProfileConsentItem[]> = {
  PATIENT: [
    {
      key: 'TRATAMENTO_DADOS_SAUDE',
      label: 'Autorizo o tratamento seguro dos meus dados de saúde sensíveis (Art. 11 LGPD)',
      hint: 'Necessário para controle de medicamentos, alarmes, dosagens, alergias e prontuário.',
      required: true,
    },
    {
      key: 'COMPARTILHAMENTO_CUIDADOR',
      label: 'Autorizo compartilhamento em rede com cuidadores e familiares vinculados',
      hint: 'Opcional. Permite que familiares ou profissionais autorizados acompanhem sua rotina.',
      required: false,
    },
  ],
  RESPONSIBLE: [
    {
      key: 'REPRESENTACAO_LEGAL_DEPENDENTE',
      label: 'Declaro representação legal ou autorização expressa do familiar (Art. 14 LGPD)',
      hint: 'Obrigatório. Declaro sob as penas da lei ter autorização ou tutela legal para gerenciar a saúde do titular.',
      required: true,
    },
    {
      key: 'COMPARTILHAMENTO_CUIDADOR',
      label: 'Autorizo troca de dados com a equipe assistencial e cuidadores do dependente',
      hint: 'Recomendado para integração dos cuidados e acompanhamento à distância.',
      required: false,
    },
  ],
  CAREGIVER: [
    {
      key: 'TERMO_CONFIDENCIALIDADE_SIGILO',
      label: 'Comprometo-me com o sigilo profissional, confidencialidade e zelo aos dados de pacientes',
      hint: 'Obrigatório. Vedado o compartilhamento indevido de informações médicas ou rotinas de pacientes assistidos.',
      required: true,
    },
  ],
  CARE_MANAGER: [
    {
      key: 'TERMO_GESTAO_GOVERNANCA',
      label: 'Assumo a governança, conformidade LGPD e responsabilidade administrativa da equipe',
      hint: 'Obrigatório. Responsabilidade administrativa sobre dados dos grupos de cuidado gerenciados.',
      required: true,
    },
  ],
};

const roleDefinitions: RoleDefinition[] = [
  {
    value: 'PATIENT',
    label: 'Paciente',
    badge: 'Autocuidado ou Assistido',
    shortDescription: 'Minha rotina e medicamentos',
    fullDescription:
      'Para quem vai tomar os remédios e acompanhar a própria saúde. Cenário 100% independente (sem precisar de gestor ou cuidador) ou para quem recebe auxílio de familiares.',
    targetAudience: 'Você mesmo cuidando de si ou paciente titular.',
    icon: HeartPulse,
    features: [
      'Cadastro e controle diário de medicamentos com dosagens',
      'Alarmes e notificações automáticas de cada dose no celular',
      'Registro de alergias, prontuário e histórico de saúde pessoal',
      'Exportação oficial do dossiê em PDF ou CSV (LGPD)',
      'Possibilidade de convidar familiares para acompanhar (opcional)',
    ],
  },
  {
    value: 'RESPONSIBLE',
    label: 'Responsável',
    badge: 'Apoio Familiar',
    shortDescription: 'Acompanhar familiares',
    fullDescription:
      'Para filhos, pais ou cônjuges que querem acompanhar a saúde de um familiar querido à distância, garantindo que ele não esqueça nenhuma dose.',
    targetAudience: 'Familiares que acompanham pais idosos, filhos ou parentes.',
    icon: UsersRound,
    features: [
      'Painel em tempo real com a rotina de remédios do familiar',
      'Avisos imediatos no celular se o familiar esquecer ou atrasar a dose',
      'Acompanhamento de relatórios de visitas e cuidadores',
      'Acesso seguro e restrito à rede de cuidado do paciente',
    ],
  },
  {
    value: 'CAREGIVER',
    label: 'Cuidador',
    badge: 'Profissional / Home Care',
    shortDescription: 'Atendimentos e visitas',
    fullDescription:
      'Para cuidadores profissionais, acompanhantes terapêuticos ou técnicos de enfermagem que prestam atendimento domiciliar ou institucional.',
    targetAudience: 'Profissionais autônomos ou vinculados a equipes de saúde.',
    icon: Stethoscope,
    features: [
      'Check-in e check-out de visitas domiciliares',
      'Leitor de código de barras para baixa segura de medicamentos',
      'Registro de sinais vitais, ocorrências e diário de atendimento',
      'Conexão direta com os gestores dos grupos de cuidado',
    ],
  },
  {
    value: 'CARE_MANAGER',
    label: 'Gestor',
    badge: 'Coordenação e Escalas',
    shortDescription: 'Grupos e operação',
    fullDescription:
      'Para coordenadores clínicos, clínicas, ILPIs (lares de idosos) ou administradores que gerenciam múltiplos pacientes e escalas de equipes.',
    targetAudience: 'Enfermeiros-chefe, coordenadores clínicos e diretores.',
    icon: ShieldCheck,
    features: [
      'Criação e administração de Grupos de Cuidado',
      'Atribuição de cuidadores a pacientes específicos',
      'Monitoramento operacional da equipe em tempo real',
      'Trilha de auditoria completa e conformidade LGPD',
    ],
  },
];

interface QuizQuestion {
  title: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    role: UserRole;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    title: '1. Quem tomará os remédios e será acompanhado no app?',
    subtitle: 'Nos diga qual é o objetivo central do seu cadastro:',
    options: [
      {
        label: 'Eu mesmo(a)',
        description: 'Vou usar o aplicativo para controlar meus próprios medicamentos e minha saúde.',
        role: 'PATIENT',
      },
      {
        label: 'Um familiar meu (mãe, pai, filho, cônjuge)',
        description: 'Quero acompanhar de perto se meu familiar está tomando os remédios no horário.',
        role: 'RESPONSIBLE',
      },
      {
        label: 'Meus clientes ou pacientes profissionais',
        description: 'Trabalho como cuidador(a) ou enfermagem e vou prestar atendimento direto.',
        role: 'CAREGIVER',
      },
      {
        label: 'Vários pacientes em uma clínica ou equipe',
        description: 'Coordeno uma instituição, ILPI ou equipe com múltiplos cuidadores e pacientes.',
        role: 'CARE_MANAGER',
      },
    ],
  },
  {
    title: '2. Como será a sua rotina de cuidado no dia a dia?',
    subtitle: 'Defina o seu grau de independência operacional:',
    options: [
      {
        label: 'Cuidarei de tudo sozinho(a) (100% independente)',
        description: 'Não terei cuidador nem gestor; eu mesmo gerencio minhas doses e horários.',
        role: 'PATIENT',
      },
      {
        label: 'Vou monitorar à distância e ser notificado(a)',
        description: 'Preciso saber se meu familiar tomou a dose e se precisa de apoio.',
        role: 'RESPONSIBLE',
      },
      {
        label: 'Vou até a casa do paciente para administrar',
        description: 'Preciso registrar a visita e dar baixa nos medicamentos administrados.',
        role: 'CAREGIVER',
      },
      {
        label: 'Vou organizar as escalas e monitorar a equipe',
        description: 'Supervisiono se os cuidadores cumpriram as visitas e horários previstos.',
        role: 'CARE_MANAGER',
      },
    ],
  },
  {
    title: '3. Qual recurso será mais indispensável para você?',
    subtitle: 'Escolha a funcionalidade que mais ajudará sua rotina:',
    options: [
      {
        label: 'Alarmes sonoros de cada remédio e meu prontuário',
        description: 'Notificações no meu celular para nunca atrasar uma dose da minha saúde.',
        role: 'PATIENT',
      },
      {
        label: 'Alertas se meu familiar esquecer ou atrasar o remédio',
        description: 'Segurança e tranquilidade familiar mesmo estando longe de casa.',
        role: 'RESPONSIBLE',
      },
      {
        label: 'Leitor de código de barras para baixa de remédios',
        description: 'Agilidade e segurança profissional na conferência à beira-leito.',
        role: 'CAREGIVER',
      },
      {
        label: 'Grupos de cuidado, escalas e relatórios de auditoria',
        description: 'Visão gerencial completa da operação e prontuários da equipe.',
        role: 'CARE_MANAGER',
      },
    ],
  },
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
  const [termsRead, setTermsRead] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<UserRole[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [policy, setPolicy] = useState<PrivacyPolicyDoc | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [roleConsents, setRoleConsents] = useState<Record<string, boolean>>({});
  const logo = colorScheme === 'dark' ? darkLogo : lightLogo;

  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState, setValue, watch } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'PATIENT',
    },
  });

  const currentRole = watch('role');
  const currentRoleDef = roleDefinitions.find((r) => r.value === currentRole) ?? roleDefinitions[0];
  const currentRoleRequirements = roleConsentsMap[currentRole] ?? [];
  const missingRoleConsent = currentRoleRequirements.some(
    (item) => item.required && !roleConsents[item.key],
  );

  function toggleRoleConsent(key: string) {
    setRoleConsents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setTermsError(null);
  }

  function startQuiz() {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizModalOpen(true);
  }

  function handleAnswer(role: UserRole) {
    const nextAnswers = [...quizAnswers, role];
    setQuizAnswers(nextAnswers);
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizStep(quizQuestions.length);
    }
  }

  function getRecommendation(): { role: UserRole; def: RoleDefinition; reason: string } {
    const counts: Record<UserRole, number> = {
      PATIENT: 0,
      RESPONSIBLE: 0,
      CAREGIVER: 0,
      CARE_MANAGER: 0,
    };
    for (const ans of quizAnswers) {
      if (counts[ans] !== undefined) counts[ans]++;
    }

    let bestRole: UserRole = 'PATIENT';
    let max = -1;
    for (const r of ['PATIENT', 'RESPONSIBLE', 'CAREGIVER', 'CARE_MANAGER'] as UserRole[]) {
      if (counts[r] > max) {
        max = counts[r];
        bestRole = r;
      }
    }

    const reasons: Record<UserRole, string> = {
      PATIENT:
        'Você indicou que é o próprio paciente e gerencia sua saúde com autonomia (mesmo sem cuidador ou gestor). O perfil de Paciente é perfeito para alarmes pessoais, registro de medicamentos, rotinas e histórico clínico próprio.',
      RESPONSIBLE:
        'Você indicou que quer acompanhar a medicação e saúde de um familiar. O perfil de Responsável permite receber alertas no celular se o familiar esquecer a dose e visualizar relatórios à distância.',
      CAREGIVER:
        'Você indicou que atua como profissional de cuidado ou enfermagem. O perfil de Cuidador traz leitor de código de barras para checagem à beira-leito e diário de visitas domiciliares.',
      CARE_MANAGER:
        'Você indicou que lidera uma equipe, clínica ou múltiplos pacientes. O perfil de Gestor traz visão administrativa de Grupos de Cuidado, escalas e auditoria em tempo real.',
    };

    const def = roleDefinitions.find((r) => r.value === bestRole) ?? roleDefinitions[0];
    return {
      role: bestRole,
      def,
      reason: reasons[bestRole],
    };
  }

  function applyRecommendation(role: UserRole) {
    setValue('role', role);
    setQuizModalOpen(false);
  }

  async function openTerms() {
    setTermsModalOpen(true);
    setTermsError(null);
    if (!policy) {
      setLoadingPolicy(true);
      try {
        const doc = await fetchPrivacyPolicy();
        setPolicy(doc);
      } catch {
        setPolicy({
          title: 'Política de Privacidade e Proteção de Dados - Vital Control',
          version: '1.0.0',
          lastUpdated: '2026-11-13',
          summary:
            'O Vital Control preza pela privacidade, confidencialidade e segurança dos dados pessoais e de saúde de seus usuários em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).',
          legalBases: [
            'Art. 7º, I (Consentimento do titular)',
            'Art. 11, II, "f" (Tutela da saúde, exclusivamente em procedimento realizado por profissionais de saúde ou serviços de saúde)',
            'Art. 7º, IX (Legítimo interesse do controlador para prevenção a fraudes e segurança)',
          ],
          collectedData: [
            {
              category: 'Dados Cadastrais (Comuns)',
              fields: ['Nome completo', 'E-mail', 'Senha criptografada (hash)', 'Perfil de acesso (RBAC)'],
              purpose: 'Identificação, autenticação e controle de acesso restrito ao sistema.',
            },
            {
              category: 'Dados Sensíveis de Saúde (Art. 5º, II da LGPD)',
              fields: ['Tipo sanguíneo', 'Medicamentos', 'Horários e dosagens', 'Alergias conhecidas', 'Visitas e rotinas'],
              purpose: 'Acompanhamento clínico, emissão de alertas e apoio à gestão de rotinas de cuidado.',
            },
          ],
          dataSubjectRights: [
            'Confirmação da existência de tratamento e acesso aos dados (Art. 18, I e II)',
            'Correção de dados incompletos, inexatos ou desatualizados (Art. 18, III)',
            'Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos (Art. 18, IV)',
            'Portabilidade dos dados a outro fornecedor em formatos abertos (Art. 18, V)',
            'Eliminação dos dados pessoais tratados com consentimento (Art. 18, VI)',
            'Revogação do consentimento a qualquer momento (Art. 8º, § 5º)',
          ],
          securityMeasures: [
            'Criptografia de senhas em repouso com algoritmo PBKDF2 + salt criptográfico',
            'Comunicação de dados protegida por criptografia de trânsito (TLS / HTTPS)',
            'Trilha de auditoria imutável com garantia de não-repúdio (Art. 6º, X)',
          ],
          retentionPeriod:
            'Os dados são mantidos durante o vínculo ativo do usuário, respeitando os prazos legais de guarda de prontuários médicos (mínimo de 20 anos, conforme Lei 13.787/2018).',
          dpoContact: {
            role: 'Encarregado pelo Tratamento de Dados Pessoais (DPO)',
            email: 'dpo@vitalcontrol.com.br',
          },
        });
      } finally {
        setLoadingPolicy(false);
      }
    }
  }

  function handleConfirmTermsRead() {
    setTermsRead(true);
    setAcceptedTerms(true);
    setTermsError(null);
    setTermsModalOpen(false);
  }

  async function onSubmit(values: RegisterFormValues) {
    setApiError(undefined);

    if (!termsRead || !acceptedTerms) {
      setTermsError('É obrigatório abrir, ler e aceitar a Política de Privacidade para criar a conta.');
      return;
    }

    if (missingRoleConsent) {
      setTermsError(
        `É obrigatório aceitar o termo de consentimento específico para o perfil de ${currentRoleDef.label}.`,
      );
      return;
    }

    try {
      const selectedConsentsList = Object.keys(roleConsents).filter((k) => roleConsents[k]);
      await register({
        name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
        email: values.email,
        password: values.password,
        role: values.role,
        acceptedTerms: true,
        termsVersion: policy?.version ?? '1.0.0',
        profileConsents: selectedConsentsList,
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
            <View className="gap-1">
              <Text className="text-sm font-semibold text-vc-text-dark">Tipo de perfil</Text>
              <Text className="text-xs text-vc-text-muted-dark leading-4">
                Selecione o papel que melhor descreve seu uso no Vital Control.
              </Text>
            </View>

            {/* Banner do Assistente de Perfil (Qual escolher?) */}
            <Pressable
              className="flex-row items-center justify-between rounded-xl bg-sky-500/10 border border-sky-500/25 p-3 active:opacity-80"
              onPress={startQuiz}
            >
              <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
                  <Sparkles color="#0284c7" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-sky-400">Qual escolher? Teste rápido</Text>
                  <Text className="text-[10px] text-vc-text-muted-dark leading-3.5">
                    Responda 3 perguntas para descobrir o perfil ideal para o seu objetivo
                  </Text>
                </View>
              </View>
              <ArrowRight color="#0284c7" size={16} />
            </Pressable>

            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View className="gap-2.5">
                  <View className="flex-row flex-wrap gap-2.5">
                    {roleDefinitions.map((option) => {
                      const selected = value === option.value;
                      const Icon = option.icon;

                      return (
                        <Pressable
                          className={cn(
                            'min-h-[110px] flex-1 basis-[46%] rounded-2xl border p-3 active:opacity-80',
                            selected
                              ? 'border-vc-secondary-dark bg-vc-surface-raised-dark'
                              : 'border-vc-border-dark bg-vc-surface-dark',
                          )}
                          key={option.value}
                          onPress={() => onChange(option.value)}
                        >
                          <View className="gap-2">
                            <View className="flex-row items-center justify-between">
                              <View
                                className={cn(
                                  'h-8 w-8 items-center justify-center rounded-xl',
                                  selected ? 'bg-vc-secondary-dark' : 'bg-vc-bg-dark',
                                )}
                              >
                                <Icon
                                  color={selected ? colors.background : colors.secondary}
                                  size={17}
                                />
                              </View>
                              {selected && (
                                <View className="h-5 w-5 items-center justify-center rounded-full bg-vc-secondary-dark">
                                  <Check color={colors.background} size={12} />
                                </View>
                              )}
                            </View>

                            <View className="gap-0.5">
                              <Text className="text-xs font-bold text-vc-text-dark">
                                {option.label}
                              </Text>
                              <Text className="text-[10px] text-vc-secondary-dark font-medium">
                                {option.badge}
                              </Text>
                              <Text
                                className="text-[10px] leading-3.5 text-vc-text-muted-dark mt-0.5"
                                numberOfLines={2}
                              >
                                {option.shortDescription}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Resumo do Perfil Selecionado */}
                  <View className="rounded-xl border border-vc-border-dark bg-vc-surface-dark p-3.5 gap-2.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="h-2 w-2 rounded-full bg-vc-secondary-dark" />
                        <Text className="text-xs font-bold text-vc-text-dark">
                          {currentRoleDef.label}
                        </Text>
                      </View>
                      <View className="rounded-full bg-vc-secondary-dark/15 px-2.5 py-0.5 border border-vc-secondary-dark/30">
                        <Text className="text-[10px] font-semibold text-vc-secondary-dark">
                          {currentRoleDef.badge}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-vc-text-muted-dark leading-4">
                      {currentRoleDef.fullDescription}
                    </Text>

                    <View className="gap-1.5 pt-1 border-t border-vc-border-dark/60">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-vc-text-muted-dark">
                        Principais recursos:
                      </Text>
                      {currentRoleDef.features.slice(0, 3).map((f, i) => (
                        <View key={i} className="flex-row items-center gap-1.5">
                          <Check color={colors.secondary} size={12} />
                          <Text className="text-[11px] text-vc-text-dark flex-1">{f}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Botão de largura total para comparar perfis */}
                    <Pressable
                      className="flex-row items-center justify-center gap-2 rounded-xl border border-vc-border-dark bg-vc-surface-raised-dark py-2.5 px-3 mt-1 active:opacity-75"
                      onPress={() => setDetailsModalOpen(true)}
                    >
                      <Info color={colors.secondary} size={15} />
                      <Text className="text-xs font-bold text-vc-secondary-dark">
                        Ver guia comparativo dos 4 perfis
                      </Text>
                    </Pressable>
                  </View>
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

          {/* Seção Obrigatória de Consentimento LGPD (Arts. 7º, 8º e 11 da LGPD) */}
          <View className="rounded-2xl border border-vc-border-dark bg-vc-surface-dark p-3.5 gap-2.5">
            <View className="flex-row items-center gap-2">
              <ShieldCheck color={colors.secondary} size={18} />
              <Text className="text-xs font-bold text-vc-text-dark">Termos & Privacidade de Dados (LGPD)</Text>
            </View>

            <Text className="text-[11px] text-vc-text-muted-dark leading-4">
              Para cadastrar e proteger seus dados de saúde, é obrigatório ler e concordar formalmente com nossa Política de Privacidade.
            </Text>

            <Pressable
              className="rounded-xl bg-vc-surface-raised-dark border border-vc-border-dark p-3 gap-2 active:opacity-80"
              onPress={openTerms}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <FileText color={colors.primary} size={16} />
                  <Text className="text-xs font-bold text-vc-primary-dark">
                    {termsRead ? 'Rever Política de Privacidade' : '1. Abrir e Ler Política de Privacidade'}
                  </Text>
                </View>
                {!termsRead && <ExternalLink color={colors.textMuted} size={14} />}
              </View>

              {termsRead && (
                <View className="flex-row items-center gap-1.5 self-start bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 color="#10b981" size={13} />
                  <Text className="text-[11px] font-bold text-emerald-400">Leitura confirmada</Text>
                </View>
              )}
            </Pressable>

            {/* Checkbox de Aceite Bloqueado até que o usuário leia */}
            <Pressable
              className="flex-row items-start gap-2.5 pt-1"
              onPress={() => {
                if (!termsRead) {
                  setTermsError('É obrigatório abrir e ler a Política de Privacidade antes de concordar.');
                  void openTerms();
                  return;
                }
                setAcceptedTerms(!acceptedTerms);
                setTermsError(null);
              }}
            >
              <View className="mt-0.5">
                {acceptedTerms ? (
                  <CheckCircle2 color={colors.secondary} size={18} />
                ) : (
                  <Circle color={termsRead ? colors.textMuted : colors.danger} size={18} />
                )}
              </View>
              <Text className="flex-1 text-[11px] text-vc-text-dark leading-4">
                Declaro que abri, li e concordo com o tratamento dos meus dados pessoais e dados de saúde conforme a Política de Privacidade do Vital Control.
              </Text>
            </Pressable>

            {termsError && (
              <View className="flex-row items-center gap-1.5 pt-1">
                <AlertCircle color={colors.danger} size={13} />
                <Text className="text-[11px] font-medium text-vc-danger-dark flex-1">{termsError}</Text>
              </View>
            )}
          </View>

          {/* Card de Consentimentos Específicos por Perfil (Art. 8º §4º e Art. 11 LGPD) */}
          <View className="rounded-2xl border border-vc-border-dark bg-vc-surface-dark p-3.5 gap-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 flex-1 pr-2">
                <ShieldCheck color={colors.secondary} size={17} />
                <Text className="text-xs font-bold text-vc-text-dark" numberOfLines={1}>
                  Termos do Perfil: {currentRoleDef.label}
                </Text>
              </View>
              <View className="rounded-full bg-vc-secondary-dark/15 px-2.5 py-0.5 border border-vc-secondary-dark/30">
                <Text className="text-[10px] font-semibold text-vc-secondary-dark">
                  {currentRoleDef.badge}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-vc-text-muted-dark leading-4">
              Consentimentos e declarações legais específicos para a atuação no perfil escolhido:
            </Text>

            <View className="gap-2 pt-1">
              {currentRoleRequirements.map((item) => {
                const isChecked = Boolean(roleConsents[item.key]);
                return (
                  <Pressable
                    key={item.key}
                    className="flex-row items-start gap-2.5 rounded-xl border border-vc-border-dark bg-vc-surface-raised-dark p-3 active:opacity-80"
                    onPress={() => toggleRoleConsent(item.key)}
                  >
                    <View className="mt-0.5">
                      {isChecked ? (
                        <CheckCircle2 color={colors.secondary} size={18} />
                      ) : (
                        <Circle
                          color={item.required ? colors.danger : colors.textMuted}
                          size={18}
                        />
                      )}
                    </View>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between gap-1">
                        <Text className="text-xs font-bold text-vc-text-dark flex-1">
                          {item.label}
                        </Text>
                        <View
                          className={cn(
                            'rounded px-1.5 py-0.5 ml-1 self-start',
                            item.required
                              ? isChecked
                                ? 'bg-emerald-500/10'
                                : 'bg-red-500/10'
                              : 'bg-sky-500/10',
                          )}
                        >
                          <Text
                            className={cn(
                              'text-[9px] font-bold',
                              item.required
                                ? isChecked
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                                : 'text-sky-400',
                            )}
                          >
                            {item.required ? 'OBRIGATÓRIO' : 'OPCIONAL'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[10px] text-vc-text-muted-dark leading-3.5">
                        {item.hint}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {apiError && <Text className="text-sm text-vc-danger-dark">{apiError}</Text>}

          <Button
            className="mt-2"
            disabled={!acceptedTerms || !termsRead || missingRoleConsent}
            label={
              !termsRead
                ? 'Leia os termos para cadastrar'
                : !acceptedTerms
                ? 'Aceite os termos para cadastrar'
                : missingRoleConsent
                ? `Aceite os termos de ${currentRoleDef.label}`
                : 'Cadastrar'
            }
            loading={formState.isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />

          <Text className="text-center text-vc-text-muted-dark mt-2">
            Já possui conta? <Link className="font-bold text-vc-secondary-dark" href="/(auth)/login">Entrar</Link>
          </Text>
      </KeyboardAwareScrollView>

      {/* Modal de Leitura Obrigatória da Política de Privacidade (RF03 / Art. 9º LGPD) */}
      <ModalSheet
        footer={
          <Button
            label="Li e Compreendi os Termos"
            onPress={handleConfirmTermsRead}
            variant="primary"
          />
        }
        onClose={() => setTermsModalOpen(false)}
        title="Política de Privacidade e LGPD"
        visible={termsModalOpen}
      >
        {loadingPolicy ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <View className="gap-3">
            <Text className="text-xs font-bold text-vc-text-dark">{policy?.title}</Text>
            <Text className="text-[11px] text-vc-text-muted-dark leading-5">{policy?.summary}</Text>

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Bases Legais (Art. 7º e 11 da LGPD):</Text>
            {policy?.legalBases.map((b, i) => (
              <Text className="text-[11px] text-vc-text-muted-dark" key={i}>• {b}</Text>
            ))}

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Dados Coletados e Finalidades:</Text>
            {policy?.collectedData.map((c, i) => (
              <View className="rounded-lg border border-vc-border-dark p-2.5 gap-1 bg-vc-surface-dark" key={i}>
                <Text className="text-xs font-semibold text-vc-primary-dark">{c.category}</Text>
                <Text className="text-[11px] text-vc-text-dark">Campos: {c.fields.join(', ')}</Text>
                <Text className="text-[10px] text-vc-text-muted-dark">Finalidade: {c.purpose}</Text>
              </View>
            ))}

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Seus Direitos como Titular (Art. 18 LGPD):</Text>
            {policy?.dataSubjectRights.map((r, i) => (
              <Text className="text-[11px] text-vc-text-muted-dark" key={i}>• {r}</Text>
            ))}

            <Text className="mt-2 text-xs font-bold text-vc-text-dark">Segurança & Criptografia:</Text>
            {policy?.securityMeasures.map((s, i) => (
              <Text className="text-[11px] text-vc-text-muted-dark" key={i}>• {s}</Text>
            ))}

            <View className="mt-2 p-2.5 rounded-lg border border-vc-border-dark bg-vc-surface-dark">
              <Text className="text-[11px] text-vc-text-dark font-semibold">Contato do DPO / Encarregado:</Text>
              <Text className="text-[10px] text-vc-text-muted-dark">
                {policy?.dpoContact.role}: {policy?.dpoContact.email}
              </Text>
            </View>
          </View>
        )}
      </ModalSheet>

      {/* Modal 2: Assistente de Escolha de Perfil (3 Perguntas Rápidas) */}
      <ModalSheet
        onClose={() => setQuizModalOpen(false)}
        subtitle={
          quizStep < quizQuestions.length
            ? `Pergunta ${quizStep + 1} de ${quizQuestions.length}`
            : 'Resultado baseado nas suas respostas'
        }
        title={quizStep < quizQuestions.length ? 'Descubra seu Perfil Ideal' : 'Perfil Recomendado'}
        visible={quizModalOpen}
      >
        {quizStep < quizQuestions.length ? (
          <View className="gap-3.5">
            <View className="gap-1">
              <Text className="text-sm font-bold text-vc-text-dark">
                {quizQuestions[quizStep].title}
              </Text>
              <Text className="text-xs text-vc-text-muted-dark">
                {quizQuestions[quizStep].subtitle}
              </Text>
            </View>

            <View className="gap-2">
              {quizQuestions[quizStep].options.map((opt, idx) => (
                <Pressable
                  key={idx}
                  className="rounded-xl border border-vc-border-dark bg-vc-surface-dark p-3.5 gap-1 active:opacity-75"
                  onPress={() => handleAnswer(opt.role)}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-vc-text-dark flex-1">
                      {opt.label}
                    </Text>
                    <ArrowRight color={colors.textMuted} size={14} />
                  </View>
                  <Text className="text-[11px] text-vc-text-muted-dark leading-4">
                    {opt.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          (() => {
            const rec = getRecommendation();
            const Icon = rec.def.icon;
            return (
              <View className="gap-3.5">
                <View className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 gap-2.5">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-vc-secondary-dark">
                      <Icon color={colors.background} size={22} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Sparkles color="#0284c7" size={13} />
                        <Text className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                          Recomendado para Você
                        </Text>
                      </View>
                      <Text className="text-base font-bold text-vc-text-dark">
                        {rec.def.label}
                      </Text>
                      <Text className="text-xs text-vc-secondary-dark font-medium">
                        {rec.def.badge}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-vc-text-dark leading-4 pt-1">
                    {rec.reason}
                  </Text>
                </View>

                <View className="rounded-xl border border-vc-border-dark bg-vc-surface-dark p-3.5 gap-2">
                  <Text className="text-xs font-bold text-vc-text-dark">
                    Recursos que você terá neste perfil:
                  </Text>
                  {rec.def.features.map((f, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <CheckCircle2 color="#10b981" size={14} />
                      <Text className="text-xs text-vc-text-dark flex-1">{f}</Text>
                    </View>
                  ))}
                </View>

                <View className="gap-2 pt-1">
                  <Button
                    label={`Aplicar Perfil ${rec.def.label}`}
                    onPress={() => applyRecommendation(rec.role)}
                    variant="primary"
                  />
                  <Button
                    label="Refazer perguntas"
                    onPress={startQuiz}
                    variant="ghost"
                  />
                </View>
              </View>
            );
          })()
        )}
      </ModalSheet>

      {/* Modal 3: Comparativo Detalhado dos 4 Perfis */}
      <ModalSheet
        onClose={() => setDetailsModalOpen(false)}
        subtitle="Entenda os objetivos, público e recursos de cada perfil"
        title="Guia dos 4 Perfis do Vital Control"
        visible={detailsModalOpen}
      >
        <View className="gap-3 pb-8">
          {roleDefinitions.map((roleItem) => {
            const Icon = roleItem.icon;
            const isCurrent = currentRole === roleItem.value;

            return (
              <View
                key={roleItem.value}
                className={cn(
                  'rounded-xl border p-3.5 gap-2.5',
                  isCurrent
                    ? 'border-vc-secondary-dark bg-vc-surface-raised-dark'
                    : 'border-vc-border-dark bg-vc-surface-dark',
                )}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View
                      className={cn(
                        'h-9 w-9 items-center justify-center rounded-xl shrink-0',
                        isCurrent ? 'bg-vc-secondary-dark' : 'bg-vc-bg-dark',
                      )}
                    >
                      <Icon
                        color={isCurrent ? colors.background : colors.secondary}
                        size={18}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-vc-text-dark">
                        {roleItem.label}
                      </Text>
                      <Text className="text-[10px] text-vc-secondary-dark font-medium">
                        {roleItem.badge}
                      </Text>
                    </View>
                  </View>
                  {isCurrent && (
                    <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      <Text className="text-[10px] font-bold text-emerald-400">Selecionado</Text>
                    </View>
                  )}
                </View>

                <Text className="text-xs text-vc-text-dark leading-4 font-medium">
                  {roleItem.fullDescription}
                </Text>

                <View className="rounded-lg bg-black/20 p-2.5 gap-0.5">
                  <Text className="text-[10px] font-bold text-vc-text-muted-dark uppercase tracking-wider">
                    Para quem é indicado:
                  </Text>
                  <Text className="text-[11px] text-vc-text-dark">
                    {roleItem.targetAudience}
                  </Text>
                </View>

                <View className="gap-1.5 pt-1">
                  <Text className="text-[10px] font-bold text-vc-text-muted-dark uppercase tracking-wider">
                    Funcionalidades incluídas:
                  </Text>
                  {roleItem.features.map((feat, fIdx) => (
                    <View key={fIdx} className="flex-row items-center gap-1.5">
                      <Check color={colors.secondary} size={12} />
                      <Text className="text-[11px] text-vc-text-dark flex-1">{feat}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrent && (
                  <Button
                    className="mt-1 min-h-10"
                    label={`Selecionar ${roleItem.label}`}
                    onPress={() => {
                      setValue('role', roleItem.value);
                      setDetailsModalOpen(false);
                    }}
                    variant="ghost"
                  />
                )}
              </View>
            );
          })}
        </View>
      </ModalSheet>
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
