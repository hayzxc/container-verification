"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useInspectionDraftStore, type PhotoSlot } from "@/stores/inspection-draft.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInspectionApi, submitInspectionApi } from "@/features/inspections/inspections.api";
import { apiClient } from "@/lib/api-client";
import { saveDraft, queuePhoto, type OfflineInspectionDraft, type OfflinePhotoQueueItem } from "@/lib/indexed-db";
import { syncOfflineQueue } from "@/lib/offline-sync";

// Helper check digit validator
function validateIso6346(containerId: string): boolean {
  const cleanId = containerId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!/^[A-Z]{4}\d{7}$/.test(cleanId)) return false;

  const charValues: Record<string, number> = {};
  let val = 0;
  for (let i = 0; i < 26; i++) {
    val++;
    if (val % 11 === 0) val++;
    charValues[String.fromCharCode(65 + i)] = val;
  }
  for (let i = 0; i < 10; i++) {
    charValues[String(i)] = i;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = cleanId[i];
    const weight = Math.pow(2, i);
    sum += (charValues[char] ?? 0) * weight;
  }

  const checkDigit = (sum % 11) % 10;
  return checkDigit === parseInt(cleanId[10], 10);
}

const PHOTO_ANGLES = [
  { key: "FRONT", label: "FRONT ANGLE", required: true },
  { key: "BACK", label: "BACK ANGLE", required: true },
  { key: "LEFT", label: "LEFT ANGLE", required: true },
  { key: "RIGHT", label: "RIGHT ANGLE", required: true },
  { key: "INTERIOR", label: "INTERIOR", required: false },
  { key: "SERIAL", label: "SERIAL NUMBER CLOSE-UP", required: false },
  { key: "OTHER", label: "OTHER / DETAIL", required: false },
] as const;

export default function NewInspectionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    step,
    localId,
    containerId,
    inspectionType,
    locationName,
    latitude,
    longitude,
    notes,
    photos,
    initDraft,
    setDraftInfo,
    setPhotoSlot,
    clearPhotoSlot,
    nextStep,
    prevStep,
    resetDraft,
  } = useInspectionDraftStore();

  const [idError, setIdError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeAngle, setActiveAngle] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ocrPolling, setOcrPolling] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [damageLabels, setDamageLabels] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize draft localId on mount
  useEffect(() => {
    initDraft();
    return () => resetDraft();
  }, []);

  // Sync state helpers
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Retrieve GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftInfo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Step 1 validation
  const validateStep1 = () => {
    if (!containerId) {
      setIdError("Container ID is required");
      return false;
    }
    const cleanId = containerId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (!/^[A-Z]{4}\d{7}$/.test(cleanId)) {
      setIdError("Format must be 4 letters + 7 digits (e.g. ABCD1234567)");
      return false;
    }
    if (!validateIso6346(cleanId)) {
      setIdError("ISO 6346 Check Digit verification failed");
      return false;
    }
    if (!locationName) {
      setIdError("Location name is required");
      return false;
    }
    setIdError("");
    return true;
  };

  // Camera capture routines
  const startCamera = async (angleKey: string) => {
    setActiveAngle(angleKey);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // Fallback to file picker if camera stream fails
      setCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
    setActiveAngle(null);
  };

  const captureFrame = () => {
    if (!videoRef.current || !activeAngle) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          await savePhotoBlob(activeAngle, blob);
        }
      }, "image/jpeg", 0.9);
    }
    stopCamera();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeAngle) {
      await savePhotoBlob(activeAngle, file);
    }
    setActiveAngle(null);
  };

  const savePhotoBlob = async (angle: string, blob: Blob) => {
    if (!localId) return;

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(4)}`;
    const previewUrl = URL.createObjectURL(blob);

    // Save to Zustand store for local preview
    setPhotoSlot(angle, {
      localId: fileId,
      photoAngle: angle as any,
      previewUrl,
      status: "QUEUED",
    });

    // Save to IndexedDB upload queue
    await queuePhoto({
      localId: fileId,
      localInspectionId: localId,
      photoAngle: angle as any,
      blob,
      fileName: `${angle.toLowerCase()}_photo.jpg`,
      mimeType: blob.type || "image/jpeg",
      size: blob.size,
      status: "QUEUED",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });
  };

  // Step 3 OCR triggers
  const triggerOcrFetch = async () => {
    // If offline, skip OCR processing
    if (!isOnline) {
      setOcrResult(containerId);
      return;
    }

    setOcrPolling(true);
    try {
      // Find the serial close-up or fallback to FRONT photo for OCR
      const ocrPhoto = photos["SERIAL"] || photos["FRONT"];
      if (!ocrPhoto) {
        setOcrResult(containerId);
        setOcrPolling(false);
        return;
      }

      // Briefly upload this photo to get OCR mock results from the server if online
      // We will perform a partial save of the inspection first
      const sessionRes = await createInspectionApi({
        containerId,
        inspectionType,
        locationName,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        notes,
      });

      if (sessionRes.success) {
        const serverSessionId = sessionRes.data.id;
        // Upload photo
        const reqPhoto = await saveDraft({
          localId: localId!,
          serverId: serverSessionId,
          containerId,
          inspectionType,
          locationName,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          notes,
          status: "SYNCING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);

        const dbPhotos = await getQueuedPhotosForOcr();
        const mainPhoto = dbPhotos.find((p) => p.photoAngle === "SERIAL") || dbPhotos.find((p) => p.photoAngle === "FRONT");

        if (mainPhoto) {
          const formData = new FormData();
          const file = new File([mainPhoto.blob], mainPhoto.fileName, { type: mainPhoto.mimeType });
          formData.append("file", file);
          formData.append("photoAngle", mainPhoto.photoAngle);

          const uploadRes = await apiClient.post(`/inspections/${serverSessionId}/photos`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (uploadRes.data?.success) {
            // Poll for OCR results
            let attempts = 0;
            while (attempts < 10) {
              const ocrRes = await apiClient.get(`/inspections/${serverSessionId}/ocr`);
              if (ocrRes.data?.success && ocrRes.data.data.length > 0) {
                const item = ocrRes.data.data[0];
                setOcrResult(item.confirmedSerial || item.detectedSerial || containerId);
                setOcrConfidence(item.confidenceScore);
                setDamageLabels(item.damageLabels || []);
                break;
              }
              await new Promise((r) => setTimeout(r, 1500));
              attempts++;
            }
          }
        }
      }
    } catch (err) {
      setOcrResult(containerId);
    } finally {
      setOcrPolling(false);
    }
  };

  const getQueuedPhotosForOcr = async (): Promise<OfflinePhotoQueueItem[]> => {
    // Helper to query IndexedDB
    const { getQueuedPhotos } = await import("@/lib/indexed-db");
    return getQueuedPhotos(localId!);
  };

  useEffect(() => {
    if (step === 3) {
      triggerOcrFetch();
    }
  }, [step]);

  // Submit Inspection logic
  const handleSubmitInspection = async () => {
    if (!localId) return;
    setSubmitting(true);

    try {
      // Create local draft configuration in IndexedDB
      const newDraft: OfflineInspectionDraft = {
        localId,
        containerId: ocrResult || containerId,
        inspectionType,
        locationName,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        notes,
        status: isOnline ? "SYNCING" : "LOCAL_DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveDraft(newDraft);

      if (isOnline) {
        // Run sync sequence
        await syncOfflineQueue();
      }

      router.push("/inspector");
    } catch (err) {
      // Fallback: stay on page or redirect with error
      router.push("/inspector");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8">
      {/* Wizard Header Progress */}
      <div className="border border-ink p-4 mb-6 bg-substrate flex justify-between items-center">
        <span className="telemetry font-bold text-ink">OPERATION: NEW_INSPECTION</span>
        <span className="telemetry text-hazard font-bold">STEP_0{step} // 04</span>
      </div>

      {/* Main Container */}
      <div className="flex-1 border border-ink bg-substrate p-6 sm:p-12 flex flex-col justify-between">
        
        {/* Step 1: Container Details */}
        {step === 1 && (
          <div className="space-y-6 max-w-lg">
            <h2 className="telemetry text-hazard text-lg font-black">» Container Metadata</h2>
            
            <div className="space-y-2">
              <label className="telemetry text-xs block opacity-60">Container ID (ISO 6346)</label>
              <Input
                placeholder="ABCD1234567"
                value={containerId}
                onChange={(e) => setDraftInfo({ containerId: e.target.value.toUpperCase() })}
                className="telemetry text-lg h-12 bg-substrate border-ink border text-ink uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="telemetry text-xs block opacity-60">Inspection Type</label>
              <select
                value={inspectionType}
                onChange={(e: any) => setDraftInfo({ inspectionType: e.target.value })}
                className="telemetry w-full h-12 bg-substrate border-ink border p-2 text-ink outline-none"
              >
                <option value="ARRIVAL">ARRIVAL</option>
                <option value="DEPARTURE">DEPARTURE</option>
                <option value="PERIODIC">PERIODIC</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="telemetry text-xs block opacity-60">Location Depot</label>
              <Input
                placeholder="Depot Jakarta Barat"
                value={locationName}
                onChange={(e) => setDraftInfo({ locationName: e.target.value })}
                className="telemetry h-12 bg-substrate border-ink border text-ink"
              />
            </div>

            <div className="space-y-2">
              <label className="telemetry text-xs block opacity-60">Coordinates (GPS)</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  placeholder="Latitude, Longitude"
                  value={latitude ? `${latitude.toFixed(6)}, ${longitude?.toFixed(6)}` : ""}
                  className="telemetry h-12 bg-substrate border-ink border text-ink opacity-70 flex-1"
                />
                <Button variant="outline" className="telemetry h-12 px-4" onClick={handleGetLocation}>
                  {gpsLoading ? "Polling..." : "Acquire GPS"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="telemetry text-xs block opacity-60">Notes (Optional)</label>
              <textarea
                placeholder="Additional inspection remarks..."
                value={notes}
                onChange={(e) => setDraftInfo({ notes: e.target.value })}
                className="telemetry w-full h-24 bg-substrate border-ink border p-3 text-ink outline-none"
              />
            </div>

            {idError && <p className="telemetry text-xs text-hazard font-bold">⚠️ ERROR: {idError}</p>}
          </div>
        )}

        {/* Step 2: Photo Capture */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="telemetry text-hazard text-lg font-black">» Physical Angling Capture</h2>
            
            <input
              type="file"
              accept="image/jpeg,image/png"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {cameraActive ? (
              <div className="border border-ink relative overflow-hidden bg-black max-w-xl mx-auto">
                <video ref={videoRef} autoPlay playsInline className="w-full h-96 object-cover" />
                <div className="absolute inset-0 border-4 border-dashed border-hazard/50 pointer-events-none flex items-center justify-center">
                  <div className="telemetry text-white bg-black/60 px-4 py-2 text-[10px]">
                    GUIDE: {activeAngle} ANGLE
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button onClick={captureFrame} className="bg-hazard text-white telemetry font-bold">
                    Capture Frame
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="bg-substrate telemetry font-bold">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {PHOTO_ANGLES.map((angle) => {
                  const photo = photos[angle.key];
                  return (
                    <div key={angle.key} className="border border-ink p-4 flex flex-col justify-between bg-substrate">
                      <div>
                        <div className="telemetry text-[10px] font-bold text-ink mb-1">
                          {angle.label} {angle.required && <span className="text-hazard">*</span>}
                        </div>
                        {photo?.previewUrl ? (
                          <img src={photo.previewUrl} alt={angle.label} className="w-full h-32 object-cover border border-ink mb-2" />
                        ) : (
                          <div className="w-full h-32 border border-dashed border-ink flex items-center justify-center bg-substrate opacity-50 mb-2">
                            <span className="telemetry text-[9px] font-bold text-ink">PENDING</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => startCamera(angle.key)}
                          className="telemetry text-[10px] flex-1 h-8 bg-ink text-white"
                        >
                          Camera
                        </Button>
                        {photo && (
                          <Button
                            onClick={() => clearPhotoSlot(angle.key)}
                            variant="outline"
                            className="telemetry text-[10px] h-8 text-hazard border-hazard px-2"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: OCR Review */}
        {step === 3 && (
          <div className="space-y-6 max-w-lg">
            <h2 className="telemetry text-hazard text-lg font-black">» OCR Analysis Pipeline</h2>

            {ocrPolling ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-4 border-hazard border-t-transparent animate-spin" />
                <p className="telemetry text-xs font-bold text-ink">POLLING OCR CLOUD PROVIDER...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-ink p-4 bg-substrate">
                  <div className="telemetry text-[10px] opacity-60 mb-1">Detected Serial Number</div>
                  <div className="text-2xl font-black text-ink">{ocrResult || "No OCR Data"}</div>
                  {ocrConfidence !== null && (
                    <div className="telemetry text-[9px] mt-1 text-hazard font-bold">
                      Confidence Level: {(ocrConfidence * 100).toFixed(1)}%
                    </div>
                  )}
                </div>

                {damageLabels.length > 0 && (
                  <div className="border border-ink p-4 bg-substrate">
                    <div className="telemetry text-[10px] opacity-60 mb-2">CV DAMAGE LABELS DETECTED</div>
                    <div className="space-y-1">
                      {damageLabels.map((lbl, idx) => (
                        <div key={idx} className="telemetry text-xs font-bold text-hazard">
                          » {lbl.type.toUpperCase()} // CONFIDENCE: {(lbl.confidence * 100).toFixed(0)}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="telemetry text-xs block opacity-60">Verify / Confirm Container ID</label>
                  <Input
                    value={ocrResult}
                    onChange={(e) => setOcrResult(e.target.value.toUpperCase())}
                    className="telemetry text-lg h-12 bg-substrate border-ink border text-ink uppercase"
                  />
                  <span className="telemetry text-[9px] opacity-50">Please correct any mistakes before saving.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Submission Summary */}
        {step === 4 && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="telemetry text-hazard text-lg font-black">» Session Summary & Check</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-ink p-6 bg-substrate">
              <div>
                <div className="telemetry text-[10px] opacity-50 mb-1">CONTAINER ID</div>
                <div className="text-xl font-bold text-ink">{ocrResult || containerId}</div>

                <div className="telemetry text-[10px] opacity-50 mt-4 mb-1">INSPECTION TYPE</div>
                <div className="telemetry font-bold text-ink">{inspectionType}</div>

                <div className="telemetry text-[10px] opacity-50 mt-4 mb-1">DEPOT LOCATION</div>
                <div className="telemetry font-bold text-ink">{locationName}</div>
              </div>

              <div>
                <div className="telemetry text-[10px] opacity-50 mb-2">REQUIRED CAPTURES STATUS</div>
                <div className="space-y-1">
                  {PHOTO_ANGLES.map((angle) => {
                    const uploaded = !!photos[angle.key];
                    return (
                      <div key={angle.key} className="flex justify-between telemetry text-[10px]">
                        <span>{angle.label}</span>
                        <span className={uploaded ? "text-green-600 font-bold" : angle.required ? "text-hazard font-bold animate-pulse" : "opacity-45"}>
                          {uploaded ? "READY" : angle.required ? "REQUIRED" : "OPTIONAL"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {submitting && (
              <div className="bg-ink text-substrate p-4 text-center telemetry font-bold animate-pulse">
                UPLOADING PHOTO EVIDENCE AND ENQUEUING INSPECTION REPORT...
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-between gap-4 border-t border-ink pt-6">
          <Button
            variant="outline"
            disabled={step === 1 || submitting}
            onClick={prevStep}
            className="telemetry px-6 h-12"
          >
            « Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => {
                if (step === 1 && !validateStep1()) return;
                nextStep();
              }}
              className="telemetry px-8 h-12 bg-ink text-white"
            >
              Continue »
            </Button>
          ) : (
            <Button
              disabled={submitting}
              onClick={handleSubmitInspection}
              className="telemetry px-8 h-12 bg-hazard text-white font-bold cursor-pointer"
            >
              {isOnline ? "SUBMIT SECURE" : "SAVE OFFLINE DRAFT"}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
