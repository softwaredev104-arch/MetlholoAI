import { Platform } from 'react-native';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { driveJsonStore } from '@/services/drive/driveJsonStore';

export type StoredPhoto = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type PendingPhoto = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type MediaContext = {
  ownerId: string;
  farmId: string;
  recordType: 'animals' | 'crops' | 'cases' | 'diagnoses';
};

const MEDIA_BASE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function requireBrowserDrive(ownerId: string) {
  if (Platform.OS !== 'web') {
    throw new Error('Google Drive photo storage currently requires the web preview.');
  }
  if (!ownerId || !driveAuthService.isConnected()) {
    throw new Error(
      'Connect Google Drive with your MetlholoAI account before saving photos.',
    );
  }
  const token = driveAuthService.getAccessToken();
  if (!token) {
    throw new Error('Google Drive access has expired. Reconnect and retry.');
  }
  return token;
}

async function authorized(url: string, ownerId: string, init: RequestInit = {}) {
  const token = requireBrowserDrive(ownerId);
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'Google Drive authorization expired or was revoked. Reconnect and retry.'
        : 'Google Drive photo request failed (' + response.status + ').',
    );
  }
  return response;
}

async function verifyImage(photo: StoredPhoto, context: MediaContext) {
  const response = await authorized(
    MEDIA_BASE +
      '/' +
      encodeURIComponent(photo.id) +
      '?fields=id,mimeType,size,appProperties',
    context.ownerId,
  );
  const info = (await response.json()) as {
    mimeType?: string;
    appProperties?: Record<string, string>;
  };
  if (
    !info.mimeType ||
    !ALLOWED_TYPES.has(info.mimeType) ||
    info.appProperties?.ownerId !== context.ownerId ||
    info.appProperties?.farmId !== context.farmId ||
    info.appProperties?.recordType !== context.recordType
  ) {
    throw new Error('This photo is not part of the signed-in farm workspace.');
  }
}

/**
 * Binary photos live as private files in the user's Google Drive, not inside
 * JSON farm snapshots. Only immutable Drive IDs are stored on farm records.
 * This avoids broken picker/blob URLs when sessions or devices change.
 */
export const recordPhotoService = {
  isAvailable() {
    return Platform.OS === 'web' && driveAuthService.isConnected();
  },

  async upload(context: MediaContext, pending: PendingPhoto): Promise<StoredPhoto> {
    requireBrowserDrive(context.ownerId);
    if (!ALLOWED_TYPES.has(pending.mimeType)) {
      throw new Error('Choose a JPEG, PNG or WebP photo.');
    }

    const input = await fetch(pending.uri);
    if (!input.ok) throw new Error('Could not read the selected photo.');
    const bytes = await input.blob();
    if (!bytes.size || bytes.size > MAX_BYTES) {
      throw new Error('Each photo must be smaller than 8 MB.');
    }

    const rootId = await driveJsonStore.ensureRootFolder();
    const extension = MIME_EXTENSIONS[pending.mimeType];
    const safeName =
      context.recordType +
      '_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 11) +
      '.' +
      extension;
    const metadata = {
      name: safeName,
      parents: [rootId],
      mimeType: pending.mimeType,
      appProperties: {
        ownerId: context.ownerId,
        farmId: context.farmId,
        recordType: context.recordType,
      },
    };
    const boundary = 'metlholo_photo_' + Math.random().toString(36).slice(2);
    const body = new Blob(
      [
        '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        '\r\n--' + boundary + '\r\nContent-Type: ' + pending.mimeType + '\r\n\r\n',
        bytes,
        '\r\n--' + boundary + '--',
      ],
      { type: 'multipart/related; boundary=' + boundary },
    );

    const response = await authorized(
      UPLOAD_BASE + '?uploadType=multipart&fields=id,name,mimeType,size',
      context.ownerId,
      {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
        body,
      },
    );
    const saved = (await response.json()) as {
      id?: string;
      name?: string;
      mimeType?: string;
      size?: string;
    };
    if (!saved.id) throw new Error('Google Drive did not confirm the photo upload.');
    return {
      id: saved.id,
      name: pending.name || saved.name || safeName,
      mimeType: pending.mimeType,
      size: bytes.size,
      createdAt: new Date().toISOString(),
    };
  },

  async viewUrl(context: MediaContext, photo: StoredPhoto): Promise<string> {
    await verifyImage(photo, context);
    const response = await authorized(
      MEDIA_BASE + '/' + encodeURIComponent(photo.id) + '?alt=media',
      context.ownerId,
    );
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  async remove(context: MediaContext, photo: StoredPhoto) {
    await verifyImage(photo, context);
    await authorized(
      MEDIA_BASE + '/' + encodeURIComponent(photo.id),
      context.ownerId,
      { method: 'DELETE' },
    );
  },
};

export async function uploadRecordPhotos(
  context: MediaContext,
  pending: PendingPhoto[],
): Promise<StoredPhoto[]> {
  if (!pending.length) return [];
  if (!recordPhotoService.isAvailable()) {
    throw new Error('Reconnect Google Drive to save selected photos.');
  }
  const completed: StoredPhoto[] = [];
  try {
    for (const image of pending) {
      completed.push(await recordPhotoService.upload(context, image));
    }
    return completed;
  } catch (error) {
    // Uploads are not yet linked to a farm record. Remove partial orphan files
    // rather than leaving half-saved galleries in the user's Google Drive.
    await Promise.allSettled(
      completed.map(image => recordPhotoService.remove(context, image)),
    );
    throw error;
  }
}
