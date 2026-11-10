import { useEffect, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface BarcodeScannerModalProps {
  visible: boolean;
  searching: boolean;
  onClose: () => void;
  onCodeScanned: (codigo: string) => Promise<boolean>;
}

function cleanBarcode(value: string) {
  return value.replace(/\D/g, '');
}

export function BarcodeScannerModal({ visible, searching, onClose, onCodeScanned }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerLocked, setScannerLocked] = useState(false);
  const [localError, setLocalError] = useState('');
  const [askingPermission, setAskingPermission] = useState(false);
  const { width, height } = useWindowDimensions();

  const scanWidth = Math.min(width - 48, 420);
  const scanHeight = 140;
  const scanLeft = (width - scanWidth) / 2;
  const scanTop = Math.max(150, height * 0.34);

  useEffect(() => {
    async function requestWhenOpened() {
      if (!visible) return;

      setScannerLocked(false);
      setLocalError('');

      if (!permission?.granted && permission?.canAskAgain !== false) {
        setAskingPermission(true);
        try {
          await requestPermission();
        } finally {
          setAskingPermission(false);
        }
      }
    }

    void requestWhenOpened();
  }, [visible, permission?.granted, permission?.canAskAgain, requestPermission]);

  async function handleRequestPermission() {
    setLocalError('');
    setAskingPermission(true);

    try {
      const result = await requestPermission();
      if (!result.granted) setLocalError('Permissão negada. Libere a câmera nas configurações do aplicativo.');
    } finally {
      setAskingPermission(false);
    }
  }

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scannerLocked || searching) return;

    setScannerLocked(true);

    const barcode = cleanBarcode(result.data || '');
    if (!barcode) {
      setLocalError('Codigo invalido.');
      setScannerLocked(false);
      return;
    }

    const found = await onCodeScanned(barcode);
    if (found) {
      onClose();
      return;
    }

    setLocalError('Não foi possível usar esse código. Tente novamente ou digite manualmente.');
    setTimeout(() => setScannerLocked(false), 1500);
  }

  const hasPermission = permission?.granted === true;
  const deniedWithoutAsking = permission?.granted === false && permission?.canAskAgain === false;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center justify-between bg-black px-5 py-4">
          <Text className="text-lg font-bold text-white">Ler código de barras</Text>
          <TouchableOpacity activeOpacity={0.8} className="h-9 w-9 items-center justify-center rounded-full bg-white/20" onPress={onClose}>
            <X color="white" size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          {hasPermission ? (
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128'] }}
              facing="back"
              onBarcodeScanned={scannerLocked ? undefined : handleBarcodeScanned}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="mb-4 text-center text-white">A câmera precisa de permissão para ler o código.</Text>
              {askingPermission ? (
                <Text className="font-semibold text-white">Solicitando permissão...</Text>
              ) : deniedWithoutAsking ? (
                <>
                  <Text className="mb-4 text-center text-red-300">A permissão foi negada. Abra as configurações do aplicativo e libere a câmera.</Text>
                  <TouchableOpacity activeOpacity={0.85} className="rounded-xl bg-vc-primary-dark px-5 py-3" onPress={() => Linking.openSettings()}>
                    <Text className="font-semibold text-white">Abrir configurações</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity activeOpacity={0.85} className="rounded-xl bg-vc-primary-dark px-5 py-3" onPress={handleRequestPermission}>
                  <Text className="font-semibold text-white">Permitir câmera</Text>
                </TouchableOpacity>
              )}
              {!!localError && <Text className="mt-4 text-center text-xs text-red-300">{localError}</Text>}
            </View>
          )}

          {hasPermission && (
            <>
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: scanTop }]} />
                <View style={[styles.overlay, { top: scanTop + scanHeight, left: 0, right: 0, bottom: 0 }]} />
                <View style={[styles.overlay, { top: scanTop, left: 0, width: scanLeft, height: scanHeight }]} />
                <View style={[styles.overlay, { top: scanTop, left: scanLeft + scanWidth, right: 0, height: scanHeight }]} />
                <View style={[styles.scanFrame, { top: scanTop, left: scanLeft, width: scanWidth, height: scanHeight }]} />
                <View style={[styles.scanLine, { top: scanTop + scanHeight / 2, left: scanLeft + 18, width: scanWidth - 36 }]} />
              </View>

              <View className="absolute bottom-8 left-0 right-0 px-6">
                <View className="rounded-xl bg-black/75 px-4 py-3">
                  <Text className="text-center text-sm text-white">Aponte o código de barras dentro da área destacada.</Text>
                  {searching && <Text className="mt-2 text-center text-xs text-white">Consultando medicamento...</Text>}
                  {!!localError && <Text className="mt-2 text-center text-xs text-red-300">{localError}</Text>}
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  scanFrame: {
    position: 'absolute',
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
  },
  scanLine: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 2,
  },
});
