import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface ModalSheetProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  visible: boolean;
  footer?: ReactNode;
  onClose: () => void;
}

export function ModalSheet({ title, subtitle, visible, footer, onClose, children }: ModalSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/60">
        <View className="max-h-[92%] rounded-t-3xl border-t border-vc-border-dark bg-vc-bg-dark">
          <View className="flex-row items-start justify-between gap-3 border-b border-vc-border-dark p-5">
            <View className="flex-1 gap-1">
              <Text className="text-xl font-bold text-vc-text-dark">{title}</Text>
              {subtitle && <Text className="text-sm leading-5 text-vc-text-muted-dark">{subtitle}</Text>}
            </View>
            <Pressable className="rounded-full bg-vc-surface-dark p-2 active:opacity-70" onPress={onClose}>
              <X color={colors.textMuted} size={18} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="gap-4 p-5">{children}</ScrollView>
          {footer && <View className="gap-2 border-t border-vc-border-dark p-5">{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
