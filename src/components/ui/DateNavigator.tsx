import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface DateNavigatorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  label?: string;
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function buildCenteredDateFilters(centerDate: Date) {
  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = addDays(centerDate, offset);
    return {
      key: dateKeyFromDate(date),
      shortLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
  });
}

export function DateNavigator({ selectedDate, onChange, label }: DateNavigatorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateFilters = useMemo(() => buildCenteredDateFilters(selectedDate), [selectedDate]);
  const selectedDateKey = dateKeyFromDate(selectedDate);
  const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          {label && <Text className="text-xs font-semibold uppercase text-vc-text-muted-dark">{label}</Text>}
          <Text className="mt-1 text-lg font-bold capitalize text-vc-text-dark">{selectedDateLabel}</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-vc-surface-dark active:opacity-70" onPress={() => setPickerOpen(true)}>
          <CalendarDays color={colors.secondary} size={20} />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Pressable className="h-9 w-8 items-center justify-center active:opacity-60" onPress={() => onChange(addDays(selectedDate, -1))}>
          <ChevronLeft color={colors.textMuted} size={20} />
        </Pressable>
        <View className="flex-1 flex-row items-center justify-between">
          {dateFilters.map((date) => {
            const selected = date.key === selectedDateKey;
            return (
              <Pressable
                className={cn('min-h-[58px] flex-1 items-center justify-center rounded-2xl px-1 active:opacity-75', selected && 'bg-vc-primary-dark')}
                key={date.key}
                onPress={() => onChange(new Date(`${date.key}T12:00:00`))}
              >
                <Text className={cn('text-sm font-bold', selected ? 'text-vc-bg-dark' : 'text-vc-text-dark')}>{date.day.slice(0, 2)}</Text>
                <Text className={cn('mt-0.5 text-[10px] capitalize', selected ? 'text-vc-bg-dark' : 'text-vc-text-muted-dark')}>{date.shortLabel}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable className="h-9 w-8 items-center justify-center active:opacity-60" onPress={() => onChange(addDays(selectedDate, 1))}>
          <ChevronRight color={colors.textMuted} size={20} />
        </Pressable>
      </View>

      {pickerOpen && (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          mode="date"
          onChange={(_, value) => {
            setPickerOpen(Platform.OS === 'ios');
            if (value) onChange(value);
          }}
          value={selectedDate}
        />
      )}
    </View>
  );
}
