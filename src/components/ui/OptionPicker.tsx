import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';
import type { DictionaryOption } from '@/data/agricultureDictionary';

export function OptionPicker({ label, options, selected, onChange, multi=false }: {
  label?: string; options: DictionaryOption[]; selected: string|string[]; onChange:(value:string|string[])=>void; multi?: boolean;
}) {
  const { colors } = useTheme();
  const selectedValues = Array.isArray(selected) ? selected : [selected];
  const toggle = (id:string) => {
    if (!multi) return onChange(id);
    onChange(selectedValues.includes(id) ? selectedValues.filter(v=>v!==id) : [...selectedValues,id]);
  };
  return <View style={styles.wrap}>
    {label ? <AppText variant="headline">{label}</AppText> : null}
    <View style={styles.grid}>
      {options.map(option => {
        const active=selectedValues.includes(option.id);
        return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{checked:active}}
          onPress={()=>toggle(option.id)} style={[styles.option,{borderColor:active?colors.primary:colors.border,backgroundColor:active?colors.primarySubtle:colors.surface}]}>
          <AppText>{active ? '✓ ' : ''}{option.label}</AppText>
          {option.description ? <AppText variant="caption">{option.description}</AppText> : null}
        </Pressable>;
      })}
    </View>
  </View>;
}
const styles=StyleSheet.create({wrap:{gap:Spacing.sm,marginBottom:Spacing.lg},grid:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.sm},option:{borderWidth:1,borderRadius:16,paddingHorizontal:14,paddingVertical:11}});
