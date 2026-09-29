import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseStorage } from '@/services/firebase/client';

export async function uploadProfileImage(uid: string, uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(getFirebaseStorage(), `users/${uid}/profile/avatar.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}