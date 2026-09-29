import * as ImagePicker from 'expo-image-picker';

export type MediaPermission = 'granted' | 'denied' | 'limited' | 'undetermined';

export async function requestCameraPermission(): Promise<MediaPermission> {
  const result = await ImagePicker.requestCameraPermissionsAsync();
  return result.status as MediaPermission;
}

export async function requestPhotoLibraryPermission(): Promise<MediaPermission> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return result.status as MediaPermission;
}

export async function getCameraPermission(): Promise<MediaPermission> {
  const result = await ImagePicker.getCameraPermissionsAsync();
  return result.status as MediaPermission;
}

export async function getPhotoLibraryPermission(): Promise<MediaPermission> {
  const result = await ImagePicker.getMediaLibraryPermissionsAsync();
  return result.status as MediaPermission;
}
