import { driveAuthService } from '@/services/drive/driveAuthService';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const ROOT_FOLDER = 'MetlholoAI';

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = driveAuthService.getAccessToken();
  if (!token) throw new Error('Google Drive access has expired. Reconnect to continue.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Google Drive access expired or was revoked. Reconnect your Google account.');
    }
    throw new Error('Google Drive request failed (' + response.status + ').');
  }
  return response;
}

type GoogleFile = { id: string; name: string; mimeType?: string; parents?: string[] };

function queryLiteral(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFile(name: string, parentId?: string, mimeType?: string) {
  const filters = ["name = '" + queryLiteral(name) + "'", 'trashed = false'];
  if (parentId) filters.push("'" + queryLiteral(parentId) + "' in parents");
  if (mimeType) filters.push("mimeType = '" + queryLiteral(mimeType) + "'");
  const params = new URLSearchParams({
    q: filters.join(' and '),
    spaces: 'drive',
    fields: 'nextPageToken,files(id,name,mimeType,parents)',
    pageSize: '100',
  });
  const response = await authorizedFetch(API + '/files?' + params.toString());
  const body = (await response.json()) as { files?: GoogleFile[] };
  return body.files?.[0]?.id ?? null;
}

async function findRootFolder() {
  return findFile(ROOT_FOLDER, undefined, 'application/vnd.google-apps.folder');
}

async function createMetadata(metadata: Record<string, unknown>) {
  const response = await authorizedFetch(API + '/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  return response.json() as Promise<{ id: string }>;
}

let pendingRootFolder: Promise<string> | null = null;

async function ensureRootFolder() {
  // A reconnect can synchronize several datasets at once. Reuse the same
  // folder creation promise so parallel writes never create split backups.
  if (!pendingRootFolder) {
    pendingRootFolder = (async () => {
      const existing = await findRootFolder();
      if (existing) return existing;
      return (await createMetadata({
        name: ROOT_FOLDER,
        mimeType: 'application/vnd.google-apps.folder',
      })).id;
    })();
  }
  try {
    return await pendingRootFolder;
  } finally {
    pendingRootFolder = null;
  }
}

function ownerOf(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const object = value as Record<string, unknown>;
  return typeof object.ownerId === 'string'
    ? object.ownerId
    : typeof object.uid === 'string' ? object.uid : '';
}

async function readFile<T>(fileId: string) {
  const response = await authorizedFetch(
    API + '/files/' + encodeURIComponent(fileId) + '?alt=media',
  );
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('Google Drive data is not valid JSON. Original files were not modified.');
  }
}

async function uploadJson(
  fileId: string | null,
  folderId: string,
  name: string,
  value: unknown,
) {
  const boundary = 'metlholo_' + Date.now();
  const metadata = fileId ? { name } : { name, parents: [folderId] };
  const multipart =
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' +
    JSON.stringify(value, null, 2) +
    '\r\n--' + boundary + '--';

  const target = fileId
    ? UPLOAD + '/files/' + encodeURIComponent(fileId) + '?uploadType=multipart'
    : UPLOAD + '/files?uploadType=multipart';

  const response = await authorizedFetch(target, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
    body: multipart,
  });
  return response.json() as Promise<{ id: string }>;
}

export const driveJsonStore = {
  isConnected() {
    return driveAuthService.isConnected();
  },
  // Read-only discovery: do not create empty files/folders during restoration.
  async readJson<T>(name: string): Promise<T | null> {
    const folderId = await findRootFolder();
    if (!folderId) return null;
    const fileId = await findFile(name, folderId, 'application/json');
    return fileId ? readFile<T>(fileId) : null;
  },
  async writeJson(name: string, value: unknown) {
    const owner = ownerOf(value);
    if (!owner) throw new Error('Google Drive data must contain the Firebase owner UID.');
    const folderId = await ensureRootFolder();
    const fileId = await findFile(name, folderId, 'application/json');
    if (fileId) {
      const previous = await readFile<unknown>(fileId);
      if (ownerOf(previous) !== owner) {
        throw new Error('A Google Drive file belongs to another MetlholoAI account. Nothing was overwritten.');
      }
    }
    return uploadJson(fileId, folderId, name, value);
  },
};
