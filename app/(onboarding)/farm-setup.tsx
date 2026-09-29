import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile, completeOnboarding } from '@/services/auth/userProfileService';
import { activateTestSubscription } from '@/services/subscriptions/subscriptionService';
import { createFarm } from '@/services/farms/farmRepository';
import { requestNotificationPermission } from '@/services/notifications/notifications';
import { requestForegroundLocation, reverseGeocode } from '@/services/location/location';
import { FARM_TYPES, ANIMALS, CROPS } from '@/data/agricultureDictionary';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export default function FarmSetup() {
  const { colors }=useTheme();
  const { firebaseUser, profile, refreshProfile }=useAuth();
  const [step,setStep]=useState(2);
  const [farmName,setFarmName]=useState('');
  const [farmType,setFarmType]=useState('Mixed farming');
  const [farmLocation,setFarmLocation]=useState(profile?.location?.label??'');
  const [farmCoordinates,setFarmCoordinates]=useState(profile?.location);
  const [farmDescription,setFarmDescription]=useState('');
  const [farmSize,setFarmSize]=useState('');
  const [animals,setAnimals]=useState<string[]>([]);
  const [crops,setCrops]=useState<string[]>([]);
  const [notifications,setNotifications]=useState({push:true,alerts:true,diagnosis:true,tasks:true,marketplace:false});
  const [terms,setTerms]=useState(false);
  const [privacy,setPrivacy]=useState(false);
  const [loading,setLoading]=useState(false);

  async function useCurrentFarmLocation(){
    setLoading(true);
    try{
      const coords=await requestForegroundLocation();
      if(!coords){Alert.alert('Location permission needed','Allow location access or search for your farm manually.');return;}
      const label=await reverseGeocode(coords.latitude,coords.longitude);
      const selected={...coords,label:label??''};
      setFarmCoordinates(selected);setFarmLocation(label??'');
    }finally{setLoading(false);}
  }

  async function saveFarm(){
    if(!firebaseUser||!farmName.trim())return;
    setLoading(true);
    try{
      const farm=await createFarm(firebaseUser.uid,{name:farmName.trim(),location:farmLocation.trim()||profile?.location?.label,latitude:farmCoordinates?.latitude,longitude:farmCoordinates?.longitude,description:farmDescription.trim()||undefined,size:farmSize?Number(farmSize):undefined,sizeUnit:'hectares',farmType});
      await updateUserProfile(firebaseUser.uid,{farmId:farm.id,onboardingStep:2});
      setStep(3);
    }catch(error){Alert.alert('Could not create farm',error instanceof Error?error.message:'Please try again.');}
    finally{setLoading(false);}
  }

  async function saveCategories(){
    if(!firebaseUser)return;
    setLoading(true);
    try{
      await updateUserProfile(firebaseUser.uid,{animalCategories:animals,cropCategories:crops,farmTypes:[farmType],onboardingStep:3});
      setStep(4);
    }catch(error){
      Alert.alert('Could not save selections',error instanceof Error?error.message:'Please try again.');
    }finally{setLoading(false);}
  }

  async function saveNotifications(){
    if(!firebaseUser)return;
    setLoading(true);
    try{
      let nextNotifications=notifications;
      if(notifications.push){
        const result=await requestNotificationPermission();
        nextNotifications={...notifications,push:result.granted};
        setNotifications(nextNotifications);
      }
      await updateUserProfile(firebaseUser.uid,{notificationPreferences:nextNotifications,onboardingStep:4});
      setStep(5);
    }catch(error){
      Alert.alert('Could not save notification preferences',error instanceof Error?error.message:'Please try again.');
    }finally{setLoading(false);}
  }

  async function subscribeTest(){
    if(!firebaseUser||!terms||!privacy)return;
    setLoading(true);
    try{
      await updateUserProfile(firebaseUser.uid,{onboardingStep:5,termsAcceptedAt:new Date().toISOString(),privacyAcceptedAt:new Date().toISOString()});
      await activateTestSubscription(firebaseUser.uid);
      await completeOnboarding(firebaseUser.uid);
      // Refresh the in-memory auth/profile state before leaving onboarding.
      // Otherwise the root redirect can still see the pre-completion profile
      // and send the user straight back into onboarding.
      await refreshProfile();
      router.replace('/');

    }catch(error){Alert.alert('Could not activate access',error instanceof Error?error.message:'Please try again.');}
    finally{setLoading(false);}
  }

  return <AppScreen>
    <AppText variant="caption">STEP {step} OF 5</AppText>
    {step===2?<View style={styles.section}>
      <AppText variant="largeTitle">Set up your farm</AppText>
      <AppText style={styles.subtitle}>Search your location or use GPS, then choose structured farm details instead of typing everything.</AppText>
      <AppTextField label="Farm name" value={farmName} onChangeText={setFarmName} />
      <LocationPicker value={farmLocation} loading={loading} onUseCurrent={useCurrentFarmLocation} onSelect={(selected)=>{setFarmCoordinates(selected);setFarmLocation(selected.label);}} />
      <AppTextField label="Farm size (hectares)" value={farmSize} onChangeText={setFarmSize} keyboardType="decimal-pad" />
      <AppTextField label="Description (optional)" value={farmDescription} onChangeText={setFarmDescription} multiline />
      <OptionPicker label="Farm type" options={FARM_TYPES} selected={FARM_TYPES.find(o=>o.label===farmType)?.id??''} onChange={(id)=>setFarmType(FARM_TYPES.find(o=>o.id===id)?.label??'')} />
      <AppButton title="Continue" onPress={saveFarm} loading={loading} disabled={!farmName.trim()} />
    </View>:null}
    {step===3?<View style={styles.section}>
      <AppText variant="largeTitle">What do you work with?</AppText>
      <AppText style={styles.subtitle}>Choose everything relevant. These selections will personalize intelligence, records and recommendations throughout MetlholoAI.</AppText>
      <OptionPicker label="Animals & livestock" options={ANIMALS} selected={ANIMALS.filter(o=>animals.includes(o.label)).map(o=>o.id)} multi onChange={(ids)=>setAnimals(ANIMALS.filter(o=>(ids as string[]).includes(o.id)).map(o=>o.label))} />
      <OptionPicker label="Crops & plants" options={CROPS} selected={CROPS.filter(o=>crops.includes(o.label)).map(o=>o.id)} multi onChange={(ids)=>setCrops(CROPS.filter(o=>(ids as string[]).includes(o.id)).map(o=>o.label))} />
      <AppButton title="Continue" onPress={saveCategories} loading={loading} />
    </View>:null}
    {step===4?<View style={styles.section}>
      <AppText variant="largeTitle">Stay informed</AppText>
      <AppText style={styles.subtitle}>Choose the alerts that matter to your farm.</AppText>
      {([['push','Push notifications','General MetlholoAI notifications'],['alerts','Farm alerts','Important farm events and warnings'],['diagnosis','Diagnosis alerts','High-confidence disease/pest alerts'],['tasks','Task reminders','Upcoming farm work'],['marketplace','Marketplace activity','Interest and updates on listings']] as const).map(([key,title,description])=><Pressable key={key} onPress={()=>setNotifications(n=>({...n,[key]:!n[key]}))} style={[styles.preference,{borderColor:notifications[key]?colors.primary:colors.border}]}><View style={styles.preferenceText}><AppText variant="headline">{title}</AppText><AppText style={styles.muted}>{description}</AppText></View><AppText>{notifications[key]?'ON':'OFF'}</AppText></Pressable>)}
      <AppButton title="Continue" onPress={saveNotifications} loading={loading} />
    </View>:null}
    {step===5?<View style={styles.section}>
      <AppText variant="largeTitle">Welcome to MetlholoAI</AppText>
      <AppText style={styles.subtitle}>Your agricultural intelligence workspace for farm records, crop and livestock intelligence, diagnosis, alerts, analytics and marketplace tools.</AppText>
      <View style={styles.card}><AppText variant="headline">Built around your data</AppText><AppText style={styles.muted}>Your crop, livestock and farm selections become reusable choices across records, health, feeding, tasks, inventory and marketplace.</AppText></View>
      <View style={styles.card}><AppText variant="headline">Subscription access</AppText><AppText style={styles.muted}>PayPal checkout is disabled in this test build. Test access activates Premium so the complete product flow can be exercised.</AppText></View>
      <Pressable onPress={()=>setTerms(v=>!v)} style={styles.check}><AppText>{terms?'☑':'☐'} I accept the Terms of Service</AppText></Pressable>
      <Pressable onPress={()=>setPrivacy(v=>!v)} style={styles.check}><AppText>{privacy?'☑':'☐'} I accept the Privacy Policy</AppText></Pressable>
      <AppButton title="Subscribe — Test Access" onPress={subscribeTest} loading={loading} disabled={!terms||!privacy} />
      <AppButton title="Not now — stay on onboarding" variant="secondary" onPress={()=>{}} />
    </View>:null}
  </AppScreen>;
}

const styles=StyleSheet.create({
  section:{gap:Spacing.md},
  subtitle:{opacity:.7,marginBottom:Spacing.md},
  preference:{borderWidth:1,borderRadius:16,padding:Spacing.md,flexDirection:'row',alignItems:'center',gap:Spacing.md},
  preferenceText:{flex:1},
  muted:{opacity:.68},
  card:{borderRadius:18,padding:Spacing.lg,borderWidth:1,borderColor:'#D7DED9',gap:Spacing.sm},
  check:{paddingVertical:Spacing.sm},
});