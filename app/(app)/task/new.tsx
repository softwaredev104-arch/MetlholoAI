import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
import { Spacing } from '@/design/spacing';

const categories = ['Feeding', 'Health', 'Harvest', 'Irrigation', 'Spraying', 'General', 'Maintenance'];
const priorities = ['High', 'Medium', 'Low'];

export default function NewTask() {
  const { user, farm } = usePrimaryFarm();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!user || !farm || name.trim().length < 2) return;
    setLoading(true);
    try {
      await farmDomain.tasks.create(user.uid, farm.id, {
        name: name.trim(),
        category,
        priority,
        dueDate: dueDate.trim(),
        relatedTo: relatedTo.trim(),
        notes: notes.trim(),
        status: 'pending',
      });
      router.replace('/(app)/tasks' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <AppText variant="largeTitle">New Task</AppText>
      <AppTextField label="Task title" value={name} onChangeText={setName} placeholder="Task title..." />

      <View style={styles.section}>
        <AppText variant="headline">Category</AppText>
        <View style={styles.chips}>
          {categories.map(item => (
            <ChoiceChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Priority</AppText>
        <View style={styles.chips}>
          {priorities.map(item => (
            <ChoiceChip key={item} label={item} selected={priority === item} onPress={() => setPriority(item)} />
          ))}
        </View>
      </View>

      <AppTextField label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
      <AppTextField label="Related to" value={relatedTo} onChangeText={setRelatedTo} placeholder="e.g. Bontle, North Maize Field" />
      <AppTextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Notes (optional)..." multiline numberOfLines={4} />
      <AppButton title="Add Task" icon="checkmark" onPress={save} loading={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
