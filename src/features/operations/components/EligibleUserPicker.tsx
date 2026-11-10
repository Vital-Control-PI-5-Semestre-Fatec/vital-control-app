import { Check, ChevronDown, Plus, Search, UserRound, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { cn } from '../../../utils/cn';
import type { EligibleUser } from '../api-types';

interface EligibleUserPickerProps {
  label: string;
  users: EligibleUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  emptyMessage?: string;
  description?: string;
  required?: boolean;
}

function matchesUser(user: EligibleUser, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized);
}

export function EligibleUserPicker({ label, users, selectedIds, onChange, multiple, emptyMessage = 'Nenhum usuario encontrado.', description, required }: EligibleUserPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  const filteredUsers = useMemo(
    () => users.filter((user) => matchesUser(user, query)).slice(0, 8),
    [query, selectedIds, users],
  );

  function select(userId: string) {
    if (selectedIds.includes(userId)) {
      remove(userId);
      return;
    }

    if (multiple) {
      onChange([...selectedIds, userId]);
    } else {
      onChange([userId]);
    }

    setQuery('');
    setOpen(false);
  }

  function remove(userId: string) {
    onChange(selectedIds.filter((id) => id !== userId));
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-bold text-vc-text-dark">{label}{required ? ' *' : ''}</Text>
          {description && <Text className="text-xs leading-5 text-vc-text-muted-dark">{description}</Text>}
        </View>
        <View className="rounded-full bg-vc-surface-raised-dark px-2.5 py-1">
          <Text className="text-xs font-bold text-vc-primary-dark">{selectedUsers.length} selecionado(s)</Text>
        </View>
      </View>

      {!!selectedUsers.length && (
        <View className="gap-2">
          {selectedUsers.map((user) => (
            <Pressable className="flex-row items-center gap-3 rounded-xl border border-vc-secondary-dark bg-vc-surface-raised-dark p-3 active:opacity-75" key={user.id} onPress={() => remove(user.id)}>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-vc-secondary-dark">
                <Check color={colors.background} size={16} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-vc-text-dark">{user.name}</Text>
                <Text className="text-xs text-vc-text-muted-dark">{user.email}</Text>
              </View>
              <X color={colors.textMuted} size={17} />
            </Pressable>
          ))}
        </View>
      )}

      <View className="rounded-xl border border-vc-border-dark bg-vc-surface-dark">
        <Pressable className="flex-row items-center gap-2 px-3 py-3 active:opacity-75" onPress={() => setOpen((current) => !current)}>
          <Plus color={colors.primary} size={18} />
          <Text className="flex-1 text-sm font-semibold text-vc-primary-dark">{selectedUsers.length ? 'Adicionar outra pessoa' : 'Escolher pessoa'}</Text>
          <ChevronDown color={colors.textMuted} size={18} />
        </Pressable>

        {open && (
          <View className="border-t border-vc-border-dark">
            <View className="flex-row items-center gap-2 px-3 py-2.5">
          <Search color={colors.textMuted} size={18} />
          <TextInput
            autoCapitalize="none"
            className="min-h-9 flex-1 text-sm text-vc-text-dark"
            onChangeText={(value) => {
              setQuery(value);
              setOpen(true);
            }}
            placeholder="Pesquisar por nome ou e-mail"
            placeholderTextColor={colors.textMuted}
            value={query}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <X color={colors.textMuted} size={16} />
            </Pressable>
          )}
            </View>
            <View className="gap-1 border-t border-vc-border-dark p-2">
            {filteredUsers.map((user) => (
              <Pressable className={cn('rounded-xl px-2 py-2.5 active:opacity-70', selectedIds.includes(user.id) && 'bg-vc-surface-raised-dark')} key={user.id} onPress={() => select(user.id)}>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-vc-bg-dark">
                    <UserRound color={colors.primary} size={17} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-vc-text-dark">{user.name}</Text>
                    <Text className="mt-0.5 text-xs text-vc-text-muted-dark">{user.email}</Text>
                  </View>
                  {selectedIds.includes(user.id) && <Check color={colors.secondary} size={18} />}
                </View>
              </Pressable>
            ))}
            {!filteredUsers.length && <Text className="px-2 py-3 text-xs text-vc-text-muted-dark">{emptyMessage}</Text>}
            </View>
          </View>
        )}
      </View>

      {!selectedUsers.length && required && <Text className="text-xs text-vc-warning-dark">Selecione ao menos uma pessoa para continuar.</Text>}
    </View>
  );
}
