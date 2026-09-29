import { useEffect, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';
import { uploadProfileImage } from '@/services/profile/profileMedia';
import { requestForegroundLocation, reverseGeocode } from '@/services/location/location';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export default function ProfileOnboarding() {
  const { colors } = useTheme();
  const { firebaseUser, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? firebaseUser?.displayName ?? '');
  const [image, setImage] = useState(profile?.photoURL ?? firebaseUser?.photoURL ?? null);
  const [location, setLocation] = useState(profile?.location);
  const [locationLabel, setLocationLabel] = useState(profile?.location?.label ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.location) setLocation(profile.location);
  }, [profile?.location]);

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Photo permission required', 'Allow MetlholoAI to access your photos to choose a profile image.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setImage(result.assets[0]?.uri ?? null);
  }

  async function useMyLocation() {
    setLoading(true);
    try {
      const coords = await requestForegroundLocation();
      if (!coords) {
        Alert.alert('Location permission needed', 'MetlholoAI uses your location to personalize weather and farm intelligence.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      const label = await reverseGeocode(coords.latitude, coords.longitude);
      setLocation({ ...coords, label });
      setLocationLabel(label ?? '');
    } finally {
      setLoading(false);
    }
  }

  async function next() {
    if (!firebaseUser || name.trim().length < 2) return;
    setLoading(true);
    try {
      let photoURL = image;
      if (image && image !== profile?.photoURL && !image.startsWith('http')) {
        photoURL = await uploadProfileImage(firebaseUser.uid, image);
      }
      await updateUserProfile(firebaseUser.uid, {
        displayName: name.trim(),
        photoURL,
        location: location ? { ...location, label: locationLabel || location.label } : undefined,
        onboardingStep: 1,
      });
      router.replace('/(onboarding)/farm-setup');
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="caption">STEP 1 OF 5</AppText>
      <AppText variant="largeTitle">Tell MetlholoAI about you</AppText>
      <AppText style={styles.subtitle}>Your profile powers personalized agricultural intelligence.</AppText>

      <View style={styles.avatarArea}>
        {image ? <Image source={{ uri: image }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}><AppText variant="largeTitle">M</AppText></View>}
        <AppButton title={image ? 'Change profile image' : 'Add profile image'} variant="secondary" onPress={choosePhoto} />
      </View>

      <AppTextField label="Username / display name" value={name} onChangeText={setName} autoComplete="name" />
      <LocationPicker
        value={locationLabel}
        loading={loading}
        onUseCurrent={useMyLocation}
        onSelect={(selected) => {
          setLocation(selected);
          setLocationLabel(selected.label);
        }}
      />
      {location ? <AppText>📍 {locationLabel || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}</AppText> : null}

      <AppButton title="Continue" onPress={next} loading={loading} disabled={name.trim().length < 2} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { opacity: 0.7, marginBottom: Spacing.lg },
  avatarArea: { alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg },
  avatar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
});
