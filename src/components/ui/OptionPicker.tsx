import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';
import type { DictionaryOption } from '@/data/agricultureDictionary';

type Props = {
  label?: string;
  options: DictionaryOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multi?: boolean;
  searchable?: boolean;
  maxVisible?: number;
};

export function OptionPicker({
  label,
  options,
  selected,
  onChange,
  multi = false,
  searchable = true,
  maxVisible = 24,
}: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const selectedValues = Array.isArray(selected) ? selected : [selected];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter(option =>
          [option.label, option.group, option.description].filter(Boolean).some(value =>
            String(value).toLowerCase().includes(q),
          ),
        )
      : options;

    const selectedFirst = [...matches].sort((a, b) => {
      const aSelected = selectedValues.includes(a.id) ? 0 : 1;
      const bSelected = selectedValues.includes(b.id) ? 0 : 1;
      return aSelected - bSelected || a.label.localeCompare(b.label);
    });
    return selectedFirst.slice(0, maxVisible);
  }, [maxVisible, options, query, selectedValues]);

  const toggle = (id: string) => {
    if (!multi) return onChange(id);
    onChange(selectedValues.includes(id)
      ? selectedValues.filter(value => value !== id)
      : [...selectedValues, id]);
  };

  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="headline">{label}</AppText> : null}
      {searchable && options.length > 8 ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search options…"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label ? `Search ${label}` : 'Search options'}
          style={[styles.search, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
        />
      ) : null}
      <View style={styles.grid}>
        {filtered.map(option => {
          const active = selectedValues.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: active }}
              onPress={() => toggle(option.id)}
              style={[
                styles.option,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySubtle : colors.surface,
                },
              ]}
            >
              <AppText>{active ? '✓ ' : ''}{option.label}</AppText>
              {option.group ? <AppText variant="caption">{option.group}</AppText> : null}
              {option.description ? <AppText variant="caption">{option.description}</AppText> : null}
            </Pressable>
          );
        })}
      </View>
      {!filtered.length ? <AppText style={styles.empty}>No matching options.</AppText> : null}
      {filtered.length < options.length && query.trim() === '' ? (
        <AppText variant="caption">Showing the most relevant options. Search to find more.</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm, marginBottom: Spacing.lg },
  search: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, minWidth: '30%' },
  empty: { opacity: 0.6 },
});