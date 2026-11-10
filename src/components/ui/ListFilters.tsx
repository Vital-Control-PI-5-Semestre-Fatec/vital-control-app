import { Search, X } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

export interface ListFilterOption {
  label: string;
  value: string;
  count?: number;
}

interface ListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  options?: ListFilterOption[];
  selectedOption?: string;
  onOptionChange?: (value: string) => void;
  resultCount?: number;
}

export function ListFilters({
  search,
  onSearchChange,
  placeholder = 'Buscar',
  options = [],
  selectedOption,
  onOptionChange,
  resultCount,
}: ListFiltersProps) {
  const activeOption = selectedOption ?? options[0]?.value;
  const canClearSearch = search.trim().length > 0;

  return (
    <View className="gap-3 rounded-2xl border border-vc-border-dark bg-vc-surface-dark p-3">
      <View className="min-h-11 flex-row items-center gap-2 rounded-xl border border-vc-border-dark bg-vc-bg-dark px-3">
        <Search color={colors.textMuted} size={17} />
        <TextInput
          className="min-h-11 flex-1 text-sm text-vc-text-dark"
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={search}
        />
        {canClearSearch && (
          <Pressable
            accessibilityLabel="Limpar busca"
            className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
            onPress={() => onSearchChange('')}
          >
            <X color={colors.textMuted} size={16} />
          </Pressable>
        )}
      </View>

      {!!options.length && onOptionChange && (
        <View className="flex-row flex-wrap gap-2">
          {options.map((option) => {
            const selected = activeOption === option.value;

            return (
              <Pressable
                className={cn(
                  'min-h-9 flex-row items-center rounded-xl px-3 py-2 active:opacity-80',
                  selected ? 'bg-vc-secondary-dark' : 'border border-vc-border-dark bg-vc-bg-dark',
                )}
                key={option.value}
                onPress={() => onOptionChange(option.value)}
              >
                <Text className={cn('text-xs font-bold', selected ? 'text-vc-bg-dark' : 'text-vc-text-muted-dark')}>
                  {option.label}
                  {typeof option.count === 'number' ? ` (${option.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {typeof resultCount === 'number' && (
        <Text className="text-xs font-semibold text-vc-text-muted-dark">
          {resultCount} resultado(s)
        </Text>
      )}
    </View>
  );
}
