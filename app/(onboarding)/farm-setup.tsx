import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile, completeOnboarding } from '@/services/auth/userProfileService';
import { createFarm } from '@/services/farms/farmRepository';
import { requestNotificationPermission } from '@/services/notifications/notifications';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const ANIMALS = ['Cattle','Goats','Sheep','Pigs','Chickens','Broilers','Layers','Poultry','Bees','Rabbits','Fish','Donkeys','Horses','Wildlife','Other'];
const CROPS = ['Maize','Sorghum','Wheat','Beans','Cowpeas','Groundnuts','Tomatoes','Spinach','Cabbage','Pepper','Potatoes','Grapes','Watermelon','Melons','Onions','Carrots','Leafy vegetables','Fruit trees','Other'];
const FARM_TYPES = ['Crop farming','Livestock','Mixed farming','Poultry','Horticulture','Aquaculture','Beekeeping','Agri-business','Research / advisory'];

function Chips({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  const { colors } = useTheme();
  return <View style={styles.chips}>{values.map(value => <Pressable key={value} onPress={() => onToggle(value)} style={[styles.chip,{borderColor: selected.includes(value) ? colors.primary : colors.border, backgroundColor: selected.includes(value) ? colors.primarySubtle : colors.surface}]}><AppText>{selected.includes(value) ? '✓ ' : ''}{value}</AppText></Pressable>)}</View>;
}

export default function FarmSetup() {
  const { colors } = useTheme();
  const { firebaseUser, profile } = useAuth();
  const [step, setStep] = useState(2);
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('Mixed farming');
  const [farmLocation, setFarmLocation] = useState(profile?.location?.label ?? '');
  const [farmDescription, setFarmDescription] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [animals, setAnimals] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [notifications, setNotifications] = useState({ push: true, alerts: true, diagnosis: true, tasks: true, marketplace: false });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [farmId, setFarmId] = useState<string | undefined>(profile?.farmId);

  const toggle = (items: string[], setItems: (v: string[]) => void, value: string) => setItems(items.includes(value) ? items.filter(item => item !== value) : [...items, value]);

  async function saveFarm() {
    if (!firebaseUser || !farmName.trim()) return;
    setLoading(true);
    try {
      const farm = await createFarm(firebaseUser.uid, {
        name: farmName.trim(),
        location: farmLocation.trim() || profile?.location?.label,
        latitude: profile?.location?.latitude,
        longitude: profile?.location?.longitude,
        description: farmDescription.trim() || undefined,
        size: farmSize ? Number(farmSize) : undefined,
        sizeUnit: 'hectares',
        farmType,
      });
      setFarmId(farm.id);
      await updateUserProfile(firebaseUser.uid, { farmId: farm.id, onboardingStep: 2 });
      setStep(3);
    } catch (error) {
      Alert.alert('Could not create farm', error instanceof Error ? error.message : 'Please try again.');
    } finally { setLoading(false); }
  }

  async function saveCategories() {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      await updateUserProfile(firebaseUser.uid, { animalCategories: animals, cropCategories: crops, farmTypes: [farmType], onboardingStep: 3 });
      setStep(4);
    } finally { setLoading(false); }
  }

  async function saveNotifications() {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      if (notifications.push) {
        const result = await requestNotificationPermission();
        if (!result.granted) setNotifications(current => ({ ...current, push: false }));
      }
      await updateUserProfile(firebaseUser.uid, { notificationPreferences: notifications, onboardingStep: 4 });
      setStep(5);
    } catch { setStep(5); } finally { setLoading(false); }
  }

  async function subscribeTest() {
    if (!firebaseUser || !terms || !privacy) return;
    setLoading(true);
    try {
      // PayPal is intentionally disabled in this build. This entitlement is the deterministic test path.
      await updateUserProfile(firebaseUser.uid, {
        onboardingStep: 5,
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      });
      await completeOnboarding(firebaseUser.uid);
      router.replace('/');
    } catch (error) {
      Alert.alert('Could not activate access', error instanceof Error ? error.message : 'Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <AppScreen>
      <AppText variant="caption">STEP {step} OF 5</AppText>

      {step === 2 ? <>
        <AppText variant="largeTitle">Set up your farm</AppText>
        <AppText style={styles.subtitle}>Tell us where you farm and what kind of operation you run.</AppText>
        <AppTextField label="Farm name" value={farmName} onChangeText={setFarmName} />
        <AppTextField label="Farm location" value={farmLocation} onChangeText={setFarmLocation} />
        <AppTextField label="Farm size (hectares)" value={farmSize} onChangeText={setFarmSize} keyboardType="decimal-pad" />
        <AppTextField label="Description" value={farmDescription} onChangeText={setFarmDescription} multiline />
        <AppText variant="headline">Farm type</AppText><Chips values={FARM_TYPES} selected={[farmType]} onToggle={setFarmType} />
        <AppButton title="Continue" onPress={saveFarm} loading={loading} disabled={!farmName.trim()} />
      </> : null}

      {step === 3 ? <>
        <AppText variant="largeTitle">What do you work with?</AppText>
        <AppText style={styles.subtitle}>Choose everything relevant. You can change these later.</AppText>
        <AppText variant="headline">Animals & livestock</AppText>
        <Chips values={ANIMALS} selected={animals} onToggle={v => toggle(animals,setAnimals,v)} />
        <AppText variant="headline">Crops & plants</AppText>
        <Chips values={CROPS} selected={crops} onToggle={v => toggle(crops,setCrops,v)} />
        <AppButton title="Continue" onPress={saveCategories} loading={loading} />
      </> : null}

      {step === 4 ? <>
        <AppText variant="largeTitle">Stay informed</AppText>
        <AppText style={styles.subtitle}>Choose the alerts that matter to your farm.</AppText>
        {([
          ['push','Push notifications','General MetlholoAI notifications'],
          ['alerts','Farm alerts','Important farm events and warnings'],
          ['diagnosis','Diagnosis alerts','High-confidence disease/pest alerts'],
          ['tasks','Task reminders','Upcoming farm work'],
          ['marketplace','Marketplace activity','Interest and updates on listings'],
        ] as const).map(([key,title,description]) => (
          <Pressable key={key} onPress={() => setNotifications(n => ({...n,[key]:!n[key]}))} style={[styles.preference,{borderColor:notifications[key] ? colors.primary : colors.border}]}>
            <View style={styles.preferenceText}><AppText variant="headline">{title}</AppText><AppText style={styles.muted}>{description}</AppText></View>
            <AppText>{notifications[key] ? 'ON' : 'OFF'}</AppText>
          </Pressable>
        ))}
        <AppButton title="Continue" onPress={saveNotifications} loading={loading} />
      </> : null}

      {step === 5 ? <>
        <AppText variant="largeTitle">Welcome to MetlholoAI</AppText>
        <AppText style={styles.subtitle}>Your agricultural intelligence workspace for farm records, crop and livestock intelligence, diagnosis, alerts, analytics and marketplace tools.</AppText>
        <AppCardLike title="Built for your farm" text="Track your operation, understand crop and animal health, use AI models, monitor performance and turn farm information into decisions." />
        <AppCardLike title="Subscription access" text="Premium access unlocks the complete MetlholoAI experience. PayPal checkout is disabled in this test build so we can safely test the full product flow first." />
        <Pressable onPress={() => setTerms(v=>!v)} style={styles.check}><AppText>{terms ? '☑' : '☐'} I accept the Terms of Service</AppText></Pressable>
        <Pressable onPress={() => setPrivacy(v=>!v)} style={styles.check}><AppText>{privacy ? '☑' : '☐'} I accept the Privacy Policy</AppText></Pressable>
        <AppButton title="Subscribe — Test Access" onPress={subscribeTest} loading={loading} disabled={!terms || !privacy} />
        <AppText variant="caption" style={styles.center}>PayPal integration will replace this test entitlement without changing the onboarding flow.</AppText>
      </> : null}
    </AppScreen>
  );
}

function AppCardLike({ title, text }: { title: string; text: string }) {
  return <View style={styles.card}><AppText variant="headline">{title}</AppText><AppText style={styles.muted}>{text}</AppText></View>;
}

const styles = StyleSheet.create({
  subtitle:{opacity:.7,marginBottom:Spacing.lg},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.sm,marginBottom:Spacing.lg},
  chip:{borderWidth:1,borderRadius:999,paddingHorizontal:14,paddingVertical:10},
  preference:{borderWidth:1,borderRadius:16,padding:Spacing.md,flexDirection:'row',alignItems:'center',gap:Spacing.md},
  preferenceText:{flex:1},
  muted:{opacity:.68},
  card:{borderRadius:18,padding:Spacing.lg,borderWidth:1,borderColor:'#D7DED9',gap:Spacing.sm},
  check:{paddingVertical:Spacing.sm},
  center:{textAlign:'center'},
});
