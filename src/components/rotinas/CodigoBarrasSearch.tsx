import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera, Search, X } from 'lucide-react-native';

interface CodigoBarrasSearchProps {
  codigoBarras: string;
  barcodeSearching: boolean;
  barcodeError?: string;
  primaryColor: string;
  textMutedColor: string;
  onChangeCodigo: (value: string) => void;
  onBuscarCodigo: () => void;
  onAbrirCamera: () => void;
  onClearCodigo: () => void;
}

export function CodigoBarrasSearch({
  codigoBarras,
  barcodeSearching,
  barcodeError,
  primaryColor,
  textMutedColor,
  onChangeCodigo,
  onBuscarCodigo,
  onAbrirCamera,
  onClearCodigo,
}: CodigoBarrasSearchProps) {
  const searchDisabled = barcodeSearching || codigoBarras.length === 0;

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-vc-text-dark">Codigo de barras</Text>

      <View className="flex-row items-center gap-3 rounded-xl border border-vc-border-dark bg-vc-surface-dark px-3.5 py-3">
        {barcodeSearching ? (
          <ActivityIndicator color={primaryColor} size="small" />
        ) : (
          <Search color={textMutedColor} size={18} strokeWidth={2} />
        )}

        <TextInput
          className="min-h-6 flex-1 text-base text-vc-text-dark"
          keyboardType="numeric"
          maxLength={14}
          onChangeText={onChangeCodigo}
          onSubmitEditing={onBuscarCodigo}
          placeholder="Digite o código do medicamento"
          placeholderTextColor={textMutedColor}
          returnKeyType="search"
          value={codigoBarras}
        />

        {codigoBarras.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={onClearCodigo}>
            <X color={textMutedColor} size={16} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.85}
          className={searchDisabled ? 'flex-1 items-center rounded-xl bg-vc-surface-dark py-3' : 'flex-1 items-center rounded-xl bg-vc-primary-dark py-3'}
          disabled={searchDisabled}
          onPress={onBuscarCodigo}
        >
          <Text className={searchDisabled ? 'text-sm font-semibold text-vc-text-muted-dark' : 'text-sm font-semibold text-white'}>
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-vc-secondary-dark py-3"
          disabled={barcodeSearching}
          onPress={onAbrirCamera}
        >
          <Camera color="white" size={17} strokeWidth={2.4} />
          <Text className="text-sm font-semibold text-white">Camera</Text>
        </TouchableOpacity>
      </View>

      {!!barcodeError && <Text className="text-xs text-vc-danger-dark">{barcodeError}</Text>}
    </View>
  );
}
