import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { restoreWorkspaceFromDrive } from '@/services/drive/workspaceRecoveryService';
import {
  recordPhotoService,
  type PendingPhoto,
  type StoredPhoto,
} from '@/services/drive/recordPhotoService';

type PhotoContext = {
  ownerId: string;
  farmId: string;
  recordType: 'animals' | 'crops' | 'cases' | 'diagnoses' | 'healthRecords' | 'feedingPlans' | 'treatments';
};
type Props = {
  context: PhotoContext;
  photos: StoredPhoto[];
  pending?: PendingPhoto[];
  onPhotosChange?: (photos: StoredPhoto[]) => void;
  onPendingChange?: (photos: PendingPhoto[]) => void;
  email?: string | null;
  label?: string;
  max?: number;
};

export function DrivePhotoThumbnail({
  context,
  photo,
  width = 110,
  height = 110,
}: {
  context: PhotoContext;
  photo: StoredPhoto;
  width?: number;
  height?: number;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setUri(null);
    setError(false);
    recordPhotoService.viewUrl(context, photo).then(url => {
      if (active) {
        objectUrl = url;
        setUri(url);
      } else {
        URL.revokeObjectURL(url);
      }
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [context.ownerId, context.farmId, context.recordType, photo.id]);

  if (!uri) {
    return (
      <View style={[styles.placeholder, {
        width, height, backgroundColor: colors.surfaceSecondary,
      }]}>
        <AppText variant="footnote" style={{ color: colors.textSecondary }}>
          {error ? 'Reconnect Drive to view' : 'Loading photo…'}
        </AppText>
      </View>
    );
  }
  return <Image source={{ uri }} style={{ width, height, borderRadius: 12 }} />;
}

export function RecordPhotoField({
  context, photos, pending = [], onPhotosChange, onPendingChange,
  email, label = 'Photos', max = 5,
}: Props) {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(recordPhotoService.isAvailable());
  const [connecting, setConnecting] = useState(false);
  const readOnly = !onPhotosChange || !onPendingChange;

  async function connect() {
    setConnecting(true);
    setError('');
    try {
      await driveAuthService.connect({
        ownerId: context.ownerId,
        expectedEmail: email,
        prompt: 'select_account',
      });
      // After renewing Drive permission, always reconcile existing remote
      // records before any new save can upload a potentially stale snapshot.
      await restoreWorkspaceFromDrive(context.ownerId);
      setConnected(recordPhotoService.isAvailable());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect Google Drive.');
    } finally {
      setConnecting(false);
    }
  }

  async function select(source: 'camera' | 'library') {
    setError('');
    try {
      const remaining = max - photos.length - pending.length;
      if (remaining <= 0) {
        setError('Remove a photo before adding another one.');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
          });
      if (result.canceled) return;
      const selected = result.assets.slice(0, remaining).map(asset => ({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'Farm photo.jpg',
        size: asset.fileSize,
      }));
      if (selected.some(item =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(item.mimeType) ||
        (item.size ?? 0) > 8 * 1024 * 1024
      )) {
        setError('Choose JPEG, PNG or WebP photos under 8 MB each.');
        return;
      }
      onPendingChange?.([...pending, ...selected]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to select a photo.');
    }
  }

  return (
    <View style={styles.section}>
      <AppText variant="headline">{label}</AppText>
      <AppText variant="footnote" style={{ color: colors.textSecondary }}>
        Up to {max} photos. Images are stored privately in your Google Drive;
        your farm record stores their Drive file IDs.
      </AppText>
      {!readOnly ? (
        <AppButton
          title={connected ? 'Refresh Google Drive connection' : 'Connect Google Drive for photos'}
          icon="cloud-outline"
          variant="secondary"
          loading={connecting}
          onPress={connect}
        />
      ) : null}
      {!readOnly ? (
        <View style={styles.buttons}>
          <View style={styles.button}>
            <AppButton title="Choose Photos" icon="images-outline" variant="secondary"
              disabled={photos.length + pending.length >= max}
              onPress={() => select('library')} />
          </View>
          <View style={styles.button}>
            <AppButton title="Take Photo" icon="camera-outline" variant="secondary"
              disabled={photos.length + pending.length >= max}
              onPress={() => select('camera')} />
          </View>
        </View>
      ) : null}
      <View style={styles.gallery}>
        {photos.map(photo => (
          <View key={photo.id} style={styles.photoItem}>
            <DrivePhotoThumbnail context={context} photo={photo} />
            {onPhotosChange ? (
              <Pressable accessibilityRole="button"
                onPress={() => onPhotosChange(photos.filter(item => item.id !== photo.id))}>
                <AppText style={{ color: colors.error }}>Remove</AppText>
              </Pressable>
            ) : null}
          </View>
        ))}
        {pending.map((photo, index) => (
          <View key={photo.uri + index} style={styles.photoItem}>
            <Image source={{ uri: photo.uri }} style={styles.image} />
            {onPendingChange ? (
              <Pressable accessibilityRole="button"
                onPress={() => onPendingChange(pending.filter((_, i) => i !== index))}>
                <AppText style={{ color: colors.error }}>Remove</AppText>
              </Pressable>
            ) : null}
            <AppText variant="footnote" style={{ color: colors.textSecondary }}>
              Not uploaded yet
            </AppText>
          </View>
        ))}
      </View>
      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  button: { flex: 1, minWidth: 160 },
  gallery: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  photoItem: { width: 110, gap: 4 },
  image: { width: 110, height: 110, borderRadius: 12 },
  placeholder: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6 },
});
