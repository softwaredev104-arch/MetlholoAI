import { driveAuthService } from '@/services/drive/driveAuthService';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const ROOT_FOLDER = 'MetlholoAI';

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = driveAuthService.getAccessToken();
  if (!token) throw new Error('Google Drive is not connected.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) throw new Error(`Google Drive request failed (${response.status}).`);
  return response;
}

async function findFile(name: string, parentId?: string, mimeType?: string) {
  const filters = [`name = '${name.replace(/'/g, "\\'")}'`, 'trashed = false'];
  if (parentId) filters.push(`'${parentId}' in parents`);
  if (mimeType) filters.push(`mimeType = '${mimeType}'`);
  const params = new URLSearchParams({
    q: filters.join(' and '),
    spaces: 'drive',
    fields: 'files(id,name,mimeType,parents)',
    pageSize: '10',
  });
  const response = await authorizedFetch(`${API}/files?${params.toString()}`);
  const body = await response.json() as { files?: Array<{ id: string }> };
  return body.files?.[0]?.id ?? null;
}

async function createMetadata(metadata: Record<string, unknown>) {
  const response = await authorizedFetch(`${API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  return response.json() as Promise<{ id: string }>;
}

async function ensureRootFolder() {
  const mime = 'application/vnd.google-apps.folder';
  const existing = await findFile(ROOT_FOLDER, undefined, mime);
  if (existing) return existing;
  return (await createMetadata({ name: ROOT_FOLDER, mimeType: mime })).id;
}

async function uploadJson(fileId: string | null, folderId: string, name: string, value: unknown) {
  const boundary = 'metlholo_' + Date.now();
  const metadata = fileId ? { name } : { name, parents: [folderId] };
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    JSON.stringify(value, null, 2) +
    `\r\n--${boundary}--`;

  const target = fileId
    ? `${UPLOAD}/files/${fileId}?uploadType=multipart`
    : `${UPLOAD}/files?uploadType=multipart`;

  const response = await authorizedFetch(target, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  return response.json() as Promise<{ id: string }>;
}

export const driveJsonStore = {
  isConnected() {
    return driveAuthService.isConnected();
  },
  async writeJson(name: string, value: unknown) {
    const folderId = await ensureRootFolder();
    const existing = await findFile(name, folderId, 'application/json');
    return uploadJson(existing, folderId, name, value);
  },
};
