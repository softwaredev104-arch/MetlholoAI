import { useEffect, useState } from 'react';
import {
  Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import type { CaptureExample } from '@/services/intelligence/captureGuidance';

type Props = {
  photos: CaptureExample[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

/**
 * Full-screen image inspector; native and Expo web compatible.
 * Source credits stay accessible without crowding the farming guidance cards.
 */
export function ReferencePhotoViewer({ photos, initialIndex, visible, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [showCredits, setShowCredits] = useState(false);
  const { width, height } = useWindowDimensions();
  useEffect(() => {
    if (visible) {
      setIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
      setZoom(1);
      setShowCredits(false);
    }
  }, [initialIndex, photos.length, visible]);

  if (!photos.length) return null;
  const current = photos[index] ?? photos[0];
  if (!current) return null;
  const change = (step: number) => {
    setIndex(value => Math.max(0, Math.min(value + step, photos.length - 1)));
    setZoom(1);
    setShowCredits(false);
  };
  const viewingHeight = Math.max(280, height - 250);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.topbar}>
          <AppText style={styles.white}>{`Reference ${index + 1} of ${photos.length}`}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close full-screen photo"
            onPress={onClose}
            style={styles.control}
          >
            <Ionicons name="close" color="#FFFFFF" size={28} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.photoScroll}
          maximumZoomScale={3}
          minimumZoomScale={1}
          bouncesZoom
          accessibilityLabel={`Enlarged reference photo ${index + 1}`}
        >
          <Pressable
            onPress={() => setZoom(value => value === 1 ? 2 : 1)}
            accessibilityRole="button"
            accessibilityLabel="Tap to toggle image zoom"
          >
            <Image
              source={{ uri: current.uri }}
              resizeMode="contain"
              style={{
                width: Math.max(260, width - 20),
                height: viewingHeight,
                transform: [{ scale: zoom }],
              }}
            />
          </Pressable>
        </ScrollView>
        <View style={styles.bottom}>
          <View style={styles.controls}>
            <Pressable
              onPress={() => change(-1)}
              disabled={index === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous reference photo"
              style={[styles.control, index === 0 && styles.disabled]}
            >
              <Ionicons name="chevron-back" color="#FFFFFF" size={25} />
            </Pressable>
            <Pressable
              onPress={() => setZoom(z => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              style={styles.control}
            >
              <Ionicons name="remove" color="#FFFFFF" size={25} />
            </Pressable>
            <Pressable
              onPress={() => setZoom(1)}
              accessibilityRole="button"
              accessibilityLabel="Fit image to screen"
              style={styles.control}
            >
              <AppText style={styles.white}>{Math.round(zoom * 100)}%</AppText>
            </Pressable>
            <Pressable
              onPress={() => setZoom(z => Math.min(3, Math.round((z + 0.5) * 10) / 10))}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              style={styles.control}
            >
              <Ionicons name="add" color="#FFFFFF" size={25} />
            </Pressable>
            <Pressable
              onPress={() => change(1)}
              disabled={index === photos.length - 1}
              accessibilityRole="button"
              accessibilityLabel="Next reference photo"
              style={[styles.control, index === photos.length - 1 && styles.disabled]}
            >
              <Ionicons name="chevron-forward" color="#FFFFFF" size={25} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => setShowCredits(value => !value)}
            accessibilityRole="button"
            accessibilityLabel="Show image attribution and license details"
            style={styles.creditToggle}
          >
            <Ionicons name="information-circle-outline" size={17} color="#C4D6CB" />
            <AppText style={styles.creditText}>
              {showCredits ? 'Hide image credits' : 'Image credits & license'}
            </AppText>
          </Pressable>
          {showCredits ? (
            <View style={styles.credits}>
              <AppText style={styles.creditText}>
                {current.attribution} · {current.license}
              </AppText>
              <Pressable
                onPress={() => { void Linking.openURL(current.sourceUrl); }}
                accessibilityRole="link"
                accessibilityLabel="Open original photo attribution record"
              >
                <AppText style={styles.creditLink}>Attribution record</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0A0E0B', paddingTop: 48, paddingBottom: 24 },
  topbar: {
    minHeight: 50, paddingHorizontal: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  white: { color: '#FFFFFF', fontWeight: '600' },
  photoScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: 7, paddingHorizontal: 18, paddingTop: 8, alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' },
  control: {
    minWidth: 45, minHeight: 44, alignItems: 'center', justifyContent: 'center',
  },
  disabled: { opacity: 0.25 },
  creditToggle: { flexDirection: 'row', gap: 7, alignItems: 'center', padding: 6 },
  creditText: { color: '#C4D6CB', fontSize: 13, textAlign: 'center' },
  creditLink: { color: '#A7DBB0', textDecorationLine: 'underline', textAlign: 'center', padding: 6 },
  credits: { alignItems: 'center', gap: 2, maxWidth: 520 },
});
