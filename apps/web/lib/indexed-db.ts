import { openDB, type IDBPDatabase } from "idb";

export type OfflineInspectionDraft = {
  localId: string;
  serverId?: string;
  containerId: string;
  inspectionType: "ARRIVAL" | "DEPARTURE" | "PERIODIC";
  locationName: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  status: "LOCAL_DRAFT" | "SYNCING" | "SYNCED" | "FAILED";
  createdAt: string;
  updatedAt: string;
};

export type OfflinePhotoQueueItem = {
  localId: string;
  localInspectionId: string;
  serverInspectionId?: string;
  photoAngle: "FRONT" | "BACK" | "LEFT" | "RIGHT" | "INTERIOR" | "SERIAL" | "OTHER";
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  status: "QUEUED" | "UPLOADING" | "UPLOADED" | "FAILED";
  retryCount: number;
  lastError?: string;
  createdAt: string;
};

export type OfflineSyncLog = {
  id?: number;
  timestamp: string;
  type: "INFO" | "ERROR" | "SUCCESS";
  message: string;
};

const DB_NAME = "container_verify_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("inspection_drafts")) {
          db.createObjectStore("inspection_drafts", { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains("photo_upload_queue")) {
          db.createObjectStore("photo_upload_queue", { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains("sync_logs")) {
          db.createObjectStore("sync_logs", { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDraft(draft: OfflineInspectionDraft): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("inspection_drafts", draft);
}

export async function getDraft(localId: string): Promise<OfflineInspectionDraft | undefined> {
  const db = await getDB();
  if (!db) return;
  return db.get("inspection_drafts", localId);
}

export async function getAllDrafts(): Promise<OfflineInspectionDraft[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("inspection_drafts");
}

export async function deleteDraft(localId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("inspection_drafts", localId);
}

export async function queuePhoto(photo: OfflinePhotoQueueItem): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("photo_upload_queue", photo);
}

export async function getQueuedPhotos(localInspectionId: string): Promise<OfflinePhotoQueueItem[]> {
  const db = await getDB();
  if (!db) return [];
  const allPhotos = await db.getAll("photo_upload_queue") as OfflinePhotoQueueItem[];
  return allPhotos.filter((p) => p.localInspectionId === localInspectionId);
}

export async function getAllQueuedPhotos(): Promise<OfflinePhotoQueueItem[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("photo_upload_queue");
}

export async function deletePhoto(localId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("photo_upload_queue", localId);
}

export async function addSyncLog(log: Omit<OfflineSyncLog, "id">): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("sync_logs", log);
}

export async function getSyncLogs(): Promise<OfflineSyncLog[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("sync_logs");
}

export async function clearSyncLogs(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.clear("sync_logs");
}
