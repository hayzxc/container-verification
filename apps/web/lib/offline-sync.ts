import { apiClient } from "./api-client";
import {
  getAllDrafts,
  getQueuedPhotos,
  saveDraft,
  queuePhoto,
  addSyncLog,
  deletePhoto,
  type OfflineInspectionDraft,
  type OfflinePhotoQueueItem,
} from "./indexed-db";

let isSyncing = false;

export async function syncOfflineQueue(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;
  if (isSyncing) return;

  isSyncing = true;
  await addSyncLog({
    timestamp: new Date().toISOString(),
    type: "INFO",
    message: "Starting offline queue synchronization...",
  });

  try {
    const drafts = await getAllDrafts();
    const pendingDrafts = drafts.filter((d) => d.status !== "SYNCED");

    if (pendingDrafts.length === 0) {
      isSyncing = false;
      return;
    }

    for (const draft of pendingDrafts) {
      await syncDraft(draft);
    }
  } catch (err: any) {
    await addSyncLog({
      timestamp: new Date().toISOString(),
      type: "ERROR",
      message: `Sync failed globally: ${err.message || err}`,
    });
  } finally {
    isSyncing = false;
  }
}

async function syncDraft(draft: OfflineInspectionDraft): Promise<void> {
  try {
    let serverId = draft.serverId;

    // 1. Create inspection session on server if it doesn't exist
    if (!serverId) {
      draft.status = "SYNCING";
      await saveDraft(draft);

      const response = await apiClient.post("/inspections", {
        containerId: draft.containerId,
        inspectionType: draft.inspectionType,
        locationName: draft.locationName,
        notes: draft.notes,
        latitude: draft.latitude,
        longitude: draft.longitude,
      });

      if (response.data?.success) {
        serverId = response.data.data.id;
        draft.serverId = serverId;
        await saveDraft(draft);
        await addSyncLog({
          timestamp: new Date().toISOString(),
          type: "INFO",
          message: `Created inspection server ID ${serverId} for local draft ${draft.localId}`,
        });
      } else {
        throw new Error("Failed to create inspection session on server");
      }
    }

    // 2. Upload queued photos
    const queuedPhotos = await getQueuedPhotos(draft.localId);
    const pendingPhotos = queuedPhotos.filter((p) => p.status !== "UPLOADED");

    for (const photo of pendingPhotos) {
      await uploadPhoto(serverId!, photo);
    }

    // 3. Submit inspection session if all photos are uploaded
    const updatedPhotos = await getQueuedPhotos(draft.localId);
    const allUploaded = updatedPhotos.every((p) => p.status === "UPLOADED");

    if (allUploaded) {
      const response = await apiClient.post(`/inspections/${serverId}/submit`);
      if (response.data?.success) {
        draft.status = "SYNCED";
        await saveDraft(draft);

        // Delete photos from local queue once successfully synced to save device storage
        for (const photo of updatedPhotos) {
          await deletePhoto(photo.localId);
        }

        await addSyncLog({
          timestamp: new Date().toISOString(),
          type: "SUCCESS",
          message: `Inspection session ${draft.containerId} (${serverId}) synced successfully!`,
        });
      } else {
        throw new Error("Failed to submit inspection session on server");
      }
    } else {
      throw new Error("Some photos failed to upload, cannot submit yet");
    }
  } catch (err: any) {
    draft.status = "FAILED";
    await saveDraft(draft);
    await addSyncLog({
      timestamp: new Date().toISOString(),
      type: "ERROR",
      message: `Failed syncing draft ${draft.containerId || draft.localId}: ${err.message || err}`,
    });
  }
}

async function uploadPhoto(serverId: string, photo: OfflinePhotoQueueItem): Promise<void> {
  try {
    photo.status = "UPLOADING";
    await queuePhoto(photo);

    const formData = new FormData();
    const file = new File([photo.blob], photo.fileName, { type: photo.mimeType });
    formData.append("file", file);
    formData.append("photoAngle", photo.photoAngle);

    const response = await apiClient.post(`/inspections/${serverId}/photos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data?.success) {
      photo.status = "UPLOADED";
      await queuePhoto(photo);
    } else {
      throw new Error("Photo upload failed");
    }
  } catch (err: any) {
    photo.status = "FAILED";
    photo.retryCount += 1;
    photo.lastError = err.message || err.toString();
    await queuePhoto(photo);
    throw err;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineQueue();
  });
}
