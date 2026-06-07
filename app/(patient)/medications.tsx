import { History, PackagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { ListFilters } from '../../src/components/ui/ListFilters';
import { ModalSheet } from '../../src/components/ui/ModalSheet';
import { Screen } from '../../src/components/ui/Screen';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import {
  useAdjustStock,
  useCreateMedication,
  useDeactivateMedication,
  useMedicationMovements,
  useMedications,
  useSearchMedicationByBarcode,
  useUpdateMedication,
} from '../../src/features/patient/hooks';
import type { ApiMedication } from '../../src/features/patient/api-types';
import type { ApiStockMovement, StockAdjustmentType } from '../../src/features/patient/api';
import { BarcodeScannerModal } from '../../src/components/rotinas/BarcodeScannerModal';
import { CodigoBarrasSearch } from '../../src/components/rotinas/CodigoBarrasSearch';
import { colors } from '../../src/theme/colors';
import { matchesFilterSearch } from '../../src/utils/list-filters';

const STOCK_UNITS = [
  { value: 'TABLET', label: 'Comprimido' },
  { value: 'CAPSULE', label: 'Cápsula' },
  { value: 'DROP', label: 'Gota' },
  { value: 'ML', label: 'mL' },
  { value: 'MG', label: 'mg' },
  { value: 'UNIT', label: 'Unidade' },
];

const STOCK_TYPES: Array<{
  type: StockAdjustmentType;
  label: string;
  reason: string;
}> = [
  {
    type: 'PURCHASE',
    label: 'Compra',
    reason: 'Reposição por compra',
  },
  {
    type: 'MANUAL_ADJUSTMENT_IN',
    label: 'Entrada manual',
    reason: 'Ajuste manual de entrada',
  },
  {
    type: 'MANUAL_ADJUSTMENT_OUT',
    label: 'Saída manual',
    reason: 'Ajuste manual de saída',
  },
  {
    type: 'DISCARD',
    label: 'Descarte',
    reason: 'Descarte de medicamento',
  },
];

const STOCK_TYPE_LABEL: Record<string, string> = {
  INITIAL_BALANCE: 'Saldo inicial',
  PURCHASE: 'Compra',
  MANUAL_ADJUSTMENT_IN: 'Entrada manual',
  MANUAL_ADJUSTMENT_OUT: 'Saída manual',
  DISCARD: 'Descarte',
  ADMINISTRATION: 'Administração',
};

const emptyMedication = {
  name: '',
  dosageDescription: '',
  unit: 'TABLET',
  currentQuantity: '',
  lowStockThreshold: '',
  barcode: '',
  brand: '',
  notes: '',
  imageUrl: '',
  registrationSource: 'MANUAL' as 'MANUAL' | 'COSMOS',
};

type MedicationForm = typeof emptyMedication;

type MedicationExtra = {
  active?: boolean;
  barcode?: string;
  brand?: string;
  notes?: string;
  imageUrl?: string;
  registrationSource?: 'MANUAL' | 'COSMOS';
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatStockUnit(unit?: string) {
  return STOCK_UNITS.find((item) => item.value === unit)?.label ?? unit ?? '';
}

function formatDate(value?: string) {
  if (!value) return 'Data não informada';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';

  return date.toLocaleString('pt-BR');
}

function getStringValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function parseMedicamentoCosmos(nome: string) {
  const dose = nome.match(/(\d+[\.,]?\d*\s?(MG|ML|MCG|UI|G)\b)/i)?.[0]?.trim() ?? '';

  const quantidade = nome.match(/(?:CX|CAIXA|COM|C\/|CT)\s?(\d+)/i)?.[1] ?? '';

  const isComprimido = /COMP|CPR|COMPRIMIDO|COMPRIMIDOS/i.test(nome);
  const isCapsule    = /CAP|CAPS|CAPSULA/i.test(nome);
  const isXarope     = /XPE|XAROPE/i.test(nome);
  const isInjetavel  = /INJ|INJETAVEL|AMP|AMPOLA/i.test(nome);
  const isGota       = /GT|GOTA|GOTAS/i.test(nome);

  const unit = isComprimido ? 'TABLET'
    : isCapsule   ? 'CAPSULE'
    : isGota      ? 'DROP'
    : isXarope    ? 'ML'
    : isInjetavel ? 'ML'
    : null;

  // Tenta extrair fabricante do nome (palavra em maiúsculas entre dose e CAIXA)
  // Ex: "DONAREN RETARD 150MG APSEN CAIXA 30 COMPRIMIDOS" → "APSEN"
  const brandMatch = nome.match(/\d+\s?(?:MG|ML|MCG|UI|G)\s+([A-Z]+)\s+(?:CX|CAIXA|COM)/i);
  const brandFromName = brandMatch?.[1] ?? '';

  return { dose, quantidade, unit, brandFromName };
}

function normalizeCosmosResponse(response: unknown) {
  const root = Array.isArray(response) ? response[0] : response;

  if (!root || typeof root !== 'object') {
    return null;
  }

  const data = root as Record<string, unknown>;
  const product =
    typeof data.product === 'object' && data.product !== null
      ? (data.product as Record<string, unknown>)
      : data;

  const name = getStringValue(product, [
    'description',
    'name',
    'nome',
    'product_description',
    'descricaoProduto',
  ]);

  const brandRaw = product['brand'];
  const brand =
    typeof brandRaw === 'object' && brandRaw !== null
      ? (((brandRaw as Record<string, unknown>)['name'] as string) ?? '')
      : getStringValue(product, ['brand', 'marca', 'manufacturer', 'fabricante']);

  const dosageDescription = getStringValue(product, [
    'dosageDescription',
    'dosagem',
    'dosage',
    'dose',
    'presentation',
    'apresentacao',
  ]);

  const imageUrl = getStringValue(product, [
    'imageUrl',
    'image_url',
    'thumbnail',
    'picture',
    'imagem',
  ]);

  if (!name) {
    return null;
  }

  return { name, brand, dosageDescription, imageUrl };
}

function formFromMedication(medication: ApiMedication & MedicationExtra): MedicationForm {
  return {
    name: medication.name ?? '',
    dosageDescription: medication.dosageDescription ?? '',
    unit: medication.stock?.unit ?? 'TABLET',
    currentQuantity: '',
    lowStockThreshold: medication.stock?.lowStockThreshold?.toString() ?? '',
    barcode: medication.barcode ?? '',
    brand: medication.brand ?? '',
    notes: medication.notes ?? '',
    imageUrl: medication.imageUrl ?? '',
    registrationSource: medication.registrationSource ?? 'MANUAL',
  };
}

export default function MedicationsScreen() {
  const medications = useMedications();
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const deactivateMedication = useDeactivateMedication();
  const adjustStock = useAdjustStock();
  const searchByBarcode = useSearchMedicationByBarcode();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<MedicationForm>(emptyMedication);
  const [formError, setFormError] = useState<string>();
  const [medicationSearch, setMedicationSearch] = useState('');
  const [medicationStatus, setMedicationStatus] = useState('ALL');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string>();

  const [stockId, setStockId] = useState<string>();
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockType, setStockType] = useState<StockAdjustmentType>('PURCHASE');
  const [stockReason, setStockReason] = useState('');
  const [stockError, setStockError] = useState<string>();

  const [movementsMedicationId, setMovementsMedicationId] = useState<string>();
  const movements = useMedicationMovements(movementsMedicationId);

  const selectedMovementMedication = medications.data?.find(
    (medication) => medication._id === movementsMedicationId,
  );

  const isEditing = !!editingId;
  const medicationItems = medications.data ?? [];
  const filteredMedications = medicationItems.filter((medication) => {
    const extra = medication as ApiMedication & MedicationExtra;
    const isActive = extra.active !== false;
    const lowStock =
      medication.stock.lowStockThreshold !== undefined &&
      medication.stock.currentQuantity <= medication.stock.lowStockThreshold;
    const matchesStatus =
      medicationStatus === 'ALL' ||
      (medicationStatus === 'ACTIVE' && isActive) ||
      (medicationStatus === 'INACTIVE' && !isActive) ||
      (medicationStatus === 'LOW_STOCK' && lowStock);

    return matchesStatus && matchesFilterSearch(medicationSearch, [
      medication.name,
      medication.dosageDescription,
      extra.brand,
      extra.notes,
      extra.barcode,
      formatStockUnit(medication.stock.unit),
    ]);
  });
  const medicationFilterOptions = [
    { label: 'Todos', value: 'ALL', count: medicationItems.length },
    { label: 'Ativos', value: 'ACTIVE', count: medicationItems.filter((item) => item.active !== false).length },
    { label: 'Estoque baixo', value: 'LOW_STOCK', count: medicationItems.filter((item) => item.stock.lowStockThreshold !== undefined && item.stock.currentQuantity <= item.stock.lowStockThreshold).length },
    { label: 'Inativos', value: 'INACTIVE', count: medicationItems.filter((item) => item.active === false).length },
  ];

  function openCreateForm() {
    setEditingId(undefined);
    setForm(emptyMedication);
    setFormError(undefined);
    setBarcodeError(undefined);
    setFormOpen(true);
  }

  function openEditForm(medication: ApiMedication & MedicationExtra) {
    setEditingId(medication._id);
    setForm(formFromMedication(medication));
    setFormError(undefined);
    setBarcodeError(undefined);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(undefined);
    setForm(emptyMedication);
    setFormError(undefined);
    setBarcodeError(undefined);
  }

  async function handleBarcodeSearch(code?: string) {
    const barcode = onlyNumbers(code ?? form.barcode);

    setBarcodeError(undefined);
    setForm((current) => ({ ...current, barcode }));

    if (barcode.length < 8) {
      setBarcodeError('Informe um código de barras válido.');
      return false;
    }

    try {
      const response = await searchByBarcode.mutateAsync(barcode);
      const medicationData = normalizeCosmosResponse(response);

      if (!medicationData) {
        setBarcodeError('Medicamento encontrado, mas não foi possível interpretar os dados.');
        return false;
      }

      const parsed = parseMedicamentoCosmos(medicationData.name);

      setForm((current) => ({
        ...current,
        barcode,
        name: medicationData.name || current.name,
        brand: medicationData.brand || parsed.brandFromName || current.brand,
        dosageDescription: medicationData.dosageDescription || parsed.dose || current.dosageDescription,
        unit: parsed.unit ?? current.unit,
        currentQuantity: parsed.quantidade || current.currentQuantity,
        imageUrl: medicationData.imageUrl || current.imageUrl,
        registrationSource: 'COSMOS',
      }));

      setBarcodeError(undefined);
      setFormOpen(true);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível buscar o medicamento pelo código.';

      setBarcodeError(message);
      return false;
    }
  }

  function validateMedicationForm() {
    if (!form.name.trim()) {
      return 'Informe o nome do medicamento.';
    }

    if (!form.dosageDescription.trim()) {
      return 'Informe a descrição da dose.';
    }

    if (!STOCK_UNITS.some((item) => item.value === form.unit)) {
      return 'Selecione uma unidade de estoque válida.';
    }

    if (!isEditing && Number.isNaN(Number(form.currentQuantity))) {
      return 'Informe o estoque inicial.';
    }

    if (!isEditing && Number(form.currentQuantity) < 0) {
      return 'O estoque inicial não pode ser negativo.';
    }

    if (form.lowStockThreshold && Number(form.lowStockThreshold) < 0) {
      return 'O limite de alerta não pode ser negativo.';
    }

    return undefined;
  }

  function saveMedication() {
    const validationError = validateMedicationForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const basePayload = {
      name: form.name.trim(),
      dosageDescription: form.dosageDescription.trim(),
      unit: form.unit,
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      barcode: optionalText(form.barcode),
      brand: optionalText(form.brand),
      notes: optionalText(form.notes),
      imageUrl: optionalText(form.imageUrl),
      registrationSource: form.registrationSource,
    };

    if (isEditing && editingId) {
      updateMedication.mutate(
        {
          medicationId: editingId,
          payload: basePayload,
        },
        {
          onSuccess: closeForm,
          onError: (requestError: Error) => setFormError(requestError.message),
        },
      );

      return;
    }

    createMedication.mutate(
      {
        ...basePayload,
        currentQuantity: Number(form.currentQuantity || 0),
      },
      {
        onSuccess: closeForm,
        onError: (requestError: Error) => setFormError(requestError.message),
      },
    );
  }

  function openStockModal(medicationId: string) {
    setStockId(medicationId);
    setStockQuantity('');
    setStockType('PURCHASE');
    setStockReason('');
    setStockError(undefined);
  }

  function saveStock() {
    if (!stockId) {
      return;
    }

    const quantity = Number(stockQuantity);
    const selectedType = STOCK_TYPES.find((item) => item.type === stockType);

    if (Number.isNaN(quantity) || quantity <= 0) {
      setStockError('Informe uma quantidade maior que zero.');
      return;
    }

    adjustStock.mutate(
      {
        medicationId: stockId,
        payload: {
          type: stockType,
          quantity,
          reason: optionalText(stockReason) ?? selectedType?.reason,
        },
      },
      {
        onSuccess: () => {
          setStockId(undefined);
          setStockQuantity('');
          setStockReason('');
          setStockError(undefined);
        },
        onError: (requestError: Error) => setStockError(requestError.message),
      },
    );
  }

  function confirmDeactivate(medicationId: string) {
    deactivateMedication.mutate(medicationId, {
      onError: (requestError: Error) => setFormError(requestError.message),
    });
  }

  return (
    <Screen
      title="Medicamentos"
      subtitle="Cadastre medicamentos e acompanhe o estoque."
    >
      {medications.isFetching && <ActivityIndicator color={colors.secondary} />}

      {medications.error && (
        <Text className="text-sm text-vc-danger-dark">{medications.error.message}</Text>
      )}

      <ListFilters
        onOptionChange={setMedicationStatus}
        onSearchChange={setMedicationSearch}
        options={medicationFilterOptions}
        placeholder="Buscar por nome, dose, marca ou codigo"
        resultCount={filteredMedications.length}
        search={medicationSearch}
        selectedOption={medicationStatus}
      />

      {filteredMedications.map((medication) => {
        const extra = medication as ApiMedication & MedicationExtra;
        const isActive = extra.active !== false;
        const lowStock =
          medication.stock.lowStockThreshold !== undefined &&
          medication.stock.currentQuantity <= medication.stock.lowStockThreshold;

        return (
          <Card className={isActive ? 'gap-3' : 'gap-3 opacity-60'} key={medication._id}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-bold text-vc-text-dark">{medication.name}</Text>

                <Text className="text-sm text-vc-text-muted-dark">
                  {medication.dosageDescription}
                </Text>

                {!!extra.brand && (
                  <Text className="text-xs text-vc-text-muted-dark">Marca: {extra.brand}</Text>
                )}

                {!isActive && (
                  <Text className="mt-1 text-xs font-semibold text-vc-danger-dark">
                    Medicamento inativo
                  </Text>
                )}
              </View>

              <View className="items-end gap-2">
                <StatusBadge
                  label={`${medication.stock.currentQuantity} ${formatStockUnit(
                    medication.stock.unit,
                  )}`}
                  tone={lowStock ? 'warning' : 'success'}
                />

                <StatusBadge label={isActive ? 'Ativo' : 'Inativo'} tone={isActive ? 'success' : 'warning'} />
              </View>
            </View>

            {lowStock && isActive && (
              <Text className="text-xs font-semibold text-vc-warning-dark">
                Estoque abaixo do limite configurado.
              </Text>
            )}

            {!!extra.notes && (
              <Text className="text-xs text-vc-text-muted-dark">Observações: {extra.notes}</Text>
            )}

            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                label="Editar"
                onPress={() => openEditForm(medication as ApiMedication & MedicationExtra)}
                variant="ghost"
              />

              <Button
                className="flex-1"
                label="Histórico"
                onPress={() => setMovementsMedicationId(medication._id)}
                variant="ghost"
              />
            </View>

            {isActive && (
              <View className="flex-row gap-2">
                <Button
                  className="flex-1"
                  label="Ajustar estoque"
                  onPress={() => openStockModal(medication._id)}
                  variant="ghost"
                />

                <Button
                  className="flex-1"
                  label="Desativar"
                  loading={deactivateMedication.isPending}
                  onPress={() => confirmDeactivate(medication._id)}
                  variant="ghost"
                />
              </View>
            )}
          </Card>
        );
      })}

      {!medications.isFetching && !filteredMedications.length && (
        <Text className="text-sm text-vc-text-muted-dark">Nenhum medicamento encontrado para os filtros.</Text>
      )}

      <Button label="Cadastrar medicamento" onPress={openCreateForm} />

      <ModalSheet
        footer={
          <Button
            label={isEditing ? 'Salvar alterações' : 'Cadastrar medicamento'}
            loading={createMedication.isPending || updateMedication.isPending}
            onPress={saveMedication}
          />
        }
        onClose={closeForm}
        title={isEditing ? 'Editar medicamento' : 'Novo medicamento'}
        visible={formOpen}
      >
        <CodigoBarrasSearch
          barcodeError={barcodeError}
          barcodeSearching={searchByBarcode.isPending}
          codigoBarras={form.barcode}
          onAbrirCamera={() => setScannerOpen(true)}
          onBuscarCodigo={() => {
            void handleBarcodeSearch();
          }}
          onChangeCodigo={(value: string) =>
            setForm((current) => ({
              ...current,
              barcode: onlyNumbers(value),
              registrationSource: 'MANUAL',
            }))
          }
          onClearCodigo={() =>
            setForm((current) => ({
              ...current,
              barcode: '',
              registrationSource: 'MANUAL',
            }))
          }
          primaryColor={colors.primary}
          textMutedColor={colors.textMuted}
        />

        <Input label="Nome" onChangeText={(name) => setForm({ ...form, name })} value={form.name} />

        <Input
          label="Descrição da dose"
          onChangeText={(dosageDescription) => setForm({ ...form, dosageDescription })}
          placeholder="Ex.: 50 mg"
          value={form.dosageDescription}
        />

        <Input
          label="Marca"
          onChangeText={(brand) => setForm({ ...form, brand })}
          placeholder="Ex.: EMS, Medley, Neo Química"
          value={form.brand}
        />

        <Input
          label="Observações"
          onChangeText={(notes) => setForm({ ...form, notes })}
          placeholder="Ex.: Tomar após o almoço"
          value={form.notes}
        />

        <Input
          label="Imagem ou URL"
          onChangeText={(imageUrl) => setForm({ ...form, imageUrl })}
          placeholder="Opcional"
          value={form.imageUrl}
        />

        <View className="gap-2">
          <Text className="text-sm font-semibold text-vc-text-dark">Unidade de estoque</Text>

          <View className="flex-row flex-wrap gap-2">
            {STOCK_UNITS.map((unit) => {
              const selected = form.unit === unit.value;

              return (
                <Pressable
                  className={
                    selected
                      ? 'rounded-xl bg-vc-primary-dark px-3 py-2'
                      : 'rounded-xl bg-vc-surface-dark px-3 py-2'
                  }
                  key={unit.value}
                  onPress={() => setForm({ ...form, unit: unit.value })}
                >
                  <Text
                    className={
                      selected
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-vc-text-muted-dark'
                    }
                  >
                    {unit.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!isEditing && (
          <Input
            keyboardType="decimal-pad"
            label="Estoque inicial"
            onChangeText={(currentQuantity) => setForm({ ...form, currentQuantity })}
            value={form.currentQuantity}
          />
        )}

        <Input
          keyboardType="decimal-pad"
          label="Limite de alerta"
          onChangeText={(lowStockThreshold) => setForm({ ...form, lowStockThreshold })}
          value={form.lowStockThreshold}
        />

        {formError && <Text className="text-xs text-vc-danger-dark">{formError}</Text>}
      </ModalSheet>

      <ModalSheet
        footer={<Button label="Salvar movimentação" loading={adjustStock.isPending} onPress={saveStock} />}
        onClose={() => setStockId(undefined)}
        title="Ajustar estoque"
        visible={!!stockId}
      >
        <View className="flex-row items-center gap-2">
          <PackagePlus color={colors.secondary} size={18} />
          <Text className="text-sm text-vc-text-muted-dark">
            A movimentação será registrada no histórico.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-vc-text-dark">Tipo de movimentação</Text>

          <View className="flex-row flex-wrap gap-2">
            {STOCK_TYPES.map((item) => {
              const selected = stockType === item.type;

              return (
                <Pressable
                  className={
                    selected
                      ? 'rounded-xl bg-vc-primary-dark px-3 py-2'
                      : 'rounded-xl bg-vc-surface-dark px-3 py-2'
                  }
                  key={item.type}
                  onPress={() => setStockType(item.type)}
                >
                  <Text
                    className={
                      selected
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-vc-text-muted-dark'
                    }
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          keyboardType="decimal-pad"
          label="Quantidade"
          onChangeText={setStockQuantity}
          value={stockQuantity}
        />

        <Input
          label="Observação"
          onChangeText={setStockReason}
          placeholder="Opcional"
          value={stockReason}
        />

        {stockError && <Text className="text-xs text-vc-danger-dark">{stockError}</Text>}
      </ModalSheet>

      <ModalSheet
        footer={
          <Button
            label="Fechar"
            onPress={() => setMovementsMedicationId(undefined)}
            variant="ghost"
          />
        }
        onClose={() => setMovementsMedicationId(undefined)}
        title={`Histórico${selectedMovementMedication ? ` - ${selectedMovementMedication.name}` : ''}`}
        visible={!!movementsMedicationId}
      >
        <View className="flex-row items-center gap-2">
          <History color={colors.secondary} size={18} />
          <Text className="text-sm text-vc-text-muted-dark">
            Movimentações registradas para este medicamento.
          </Text>
        </View>

        {movements.isFetching && <ActivityIndicator color={colors.secondary} />}

        {movements.error && (
          <Text className="text-xs text-vc-danger-dark">{movements.error.message}</Text>
        )}

        {(movements.data ?? []).map((movement: ApiStockMovement) => (
          <Card className="gap-1" key={movement._id}>
            <Text className="text-sm font-bold text-vc-text-dark">
              {STOCK_TYPE_LABEL[movement.type] ?? movement.type}
            </Text>

            <Text className="text-xs text-vc-text-muted-dark">
              {movement.direction === 'IN' ? 'Entrada' : 'Saída'} de {movement.quantity}
            </Text>

            <Text className="text-xs text-vc-text-muted-dark">
              Estoque: {movement.stockBefore} → {movement.stockAfter}
            </Text>

            {!!movement.reason && (
              <Text className="text-xs text-vc-text-muted-dark">
                Observação: {movement.reason}
              </Text>
            )}

            <Text className="text-xs text-vc-text-muted-dark">
              {formatDate(movement.occurredAt ?? movement.createdAt)}
            </Text>
          </Card>
        ))}

        {!movements.isFetching && !movements.data?.length && (
          <Text className="text-sm text-vc-text-muted-dark">
            Nenhuma movimentação registrada.
          </Text>
        )}
      </ModalSheet>

      <BarcodeScannerModal
        onClose={() => setScannerOpen(false)}
        onCodeScanned={handleBarcodeSearch}
        searching={searchByBarcode.isPending}
        visible={scannerOpen}
      />
    </Screen>
  );
}