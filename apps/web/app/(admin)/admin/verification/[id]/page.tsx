"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getInspectionDetailApi, updateInspectionStatusApi } from "@/features/inspections/inspections.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const inspectionId = resolvedParams.id;

  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePhoto, setActivePhoto] = useState<any>(null);

  const loadDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getInspectionDetailApi(inspectionId);
      if (res.success) {
        setInspection(res.data);
        if (res.data.photos && res.data.photos.length > 0) {
          setActivePhoto(res.data.photos[0]);
        }
      } else {
        throw new Error("Failed to load details");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load inspection detail data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [inspectionId]);

  const handleAction = async (status: "APPROVED" | "REJECTED" | "CLARIFICATION") => {
    if (status === "REJECTED" && !comment) {
      alert("Please provide a reason in the comments before rejecting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await updateInspectionStatusApi(inspectionId, status, comment);
      if (res.success) {
        router.push("/admin");
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to complete verification action");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="telemetry text-center py-12">Loading inspection record details...</div>;
  }

  if (error || !inspection) {
    return <div className="telemetry text-center text-hazard py-12">{error || "No inspection data"}</div>;
  }

  // Combine OCR results and damage labels across all photos
  const ocrItems = inspection.photos
    ?.map((p: any) => p.ocrResult)
    .filter(Boolean) || [];

  return (
    <div className="space-y-6">
      {/* Header Back navigation */}
      <div className="flex justify-between items-center border border-ink p-4 bg-substrate">
        <span className="telemetry font-bold text-ink">INSPECTION DETAIL // {inspection.containerId}</span>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")} className="telemetry">
          « Back to Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 bg-ink border border-ink p-px">
        {/* Left column: Photo slide & metadata */}
        <div className="bg-substrate p-6 space-y-6">
          <div className="telemetry text-hazard font-black">» Physical Evidence Imagery</div>

          {activePhoto ? (
            <div className="space-y-4">
              <div className="border border-ink relative overflow-hidden bg-black max-h-[500px]">
                <img
                  src={activePhoto.storageUrl}
                  alt={activePhoto.photoAngle}
                  className="w-full h-auto object-contain mx-auto max-h-[450px]"
                />
                
                {/* Visual damage labels overlay overlay if present in OCR results */}
                {activePhoto.ocrResult?.damageLabels && activePhoto.ocrResult.damageLabels.map((lbl: any, idx: number) => (
                  <div
                    key={idx}
                    className="absolute border border-hazard bg-hazard/20 text-white font-mono text-[8px] p-0.5 pointer-events-none"
                    style={{
                      left: `${(lbl.bbox?.[0] || 0) * 100}%`,
                      top: `${(lbl.bbox?.[1] || 0) * 100}%`,
                      width: `${((lbl.bbox?.[2] || 0) - (lbl.bbox?.[0] || 0)) * 100}%`,
                      height: `${((lbl.bbox?.[3] || 0) - (lbl.bbox?.[1] || 0)) * 100}%`
                    }}
                  >
                    {lbl.type.toUpperCase()} ({(lbl.confidence * 100).toFixed(0)}%)
                  </div>
                ))}
              </div>

              {/* Photo Thumbnails */}
              <div className="flex gap-2 overflow-x-auto py-2">
                {inspection.photos.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePhoto(p)}
                    className={`border p-1 ${
                      activePhoto.id === p.id ? "border-hazard bg-ink/10" : "border-ink"
                    }`}
                  >
                    <img src={p.storageUrl} alt={p.photoAngle} className="w-16 h-12 object-cover" />
                  </button>
                ))}
              </div>

              {/* Active Photo EXIF metadata */}
              <div className="border border-ink p-4 bg-substrate">
                <div className="telemetry text-[10px] opacity-60 mb-2">IMAGE METADATA (EXIF)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs telemetry font-bold text-ink">
                  <div>
                    <span className="opacity-50 block text-[9px]">ANGLE:</span>
                    {activePhoto.photoAngle}
                  </div>
                  <div>
                    <span className="opacity-50 block text-[9px]">EXIF DATE:</span>
                    {activePhoto.exifTimestamp ? new Date(activePhoto.exifTimestamp).toLocaleString() : "NONE"}
                  </div>
                  <div>
                    <span className="opacity-50 block text-[9px]">DEVICE:</span>
                    {activePhoto.deviceInfo || "UNKNOWN"}
                  </div>
                  <div>
                    <span className="opacity-50 block text-[9px]">GPS COORDINATES:</span>
                    {inspection.latitude ? `${inspection.latitude.toFixed(5)}, ${inspection.longitude?.toFixed(5)}` : "NONE"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="telemetry text-center py-12 opacity-50 border border-dashed border-ink">
              No photos uploaded for this session
            </div>
          )}
        </div>

        {/* Right column: Session Info, OCR review and verification actions */}
        <div className="bg-substrate p-6 space-y-6 border-t lg:border-t-0 lg:border-l border-ink flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="telemetry text-hazard font-black mb-2">» General Details</div>
              <table className="w-full text-xs font-mono text-ink">
                <tbody>
                  <tr className="border-b border-ink/10">
                    <td className="py-2 opacity-50 font-bold">CONTAINER ID:</td>
                    <td className="py-2 font-bold">{inspection.containerId}</td>
                  </tr>
                  <tr className="border-b border-ink/10">
                    <td className="py-2 opacity-50 font-bold">INSPECTION TYPE:</td>
                    <td className="py-2 font-bold">{inspection.inspectionType}</td>
                  </tr>
                  <tr className="border-b border-ink/10">
                    <td className="py-2 opacity-50 font-bold">DEPOT DEPOT:</td>
                    <td className="py-2 font-bold">{inspection.locationName}</td>
                  </tr>
                  <tr className="border-b border-ink/10">
                    <td className="py-2 opacity-50 font-bold">INSPECTOR:</td>
                    <td className="py-2 font-bold">
                      {inspection.inspector?.fullName} ({inspection.inspector?.email})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 opacity-50 font-bold">SUBMITTED AT:</td>
                    <td className="py-2 font-bold">{new Date(inspection.createdAt).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {ocrItems.length > 0 && (
              <div className="border border-ink p-4 bg-substrate">
                <div className="telemetry text-[10px] opacity-60 mb-2">OCR ENGINE VERIFICATION</div>
                {ocrItems.map((ocr: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs telemetry font-bold text-ink">
                    <div>
                      <span className="opacity-50">Detected Serial:</span> {ocr.detectedSerial}
                    </div>
                    <div>
                      <span className="opacity-50">Confirmed Serial:</span> {ocr.confirmedSerial}
                    </div>
                    <div>
                      <span className="opacity-50">Corrected by Inspector:</span>{" "}
                      {ocr.isCorrected ? "YES (EDITED)" : "NO"}
                    </div>
                    {ocr.confidenceScore && (
                      <div>
                        <span className="opacity-50">Confidence score:</span>{" "}
                        {(ocr.confidenceScore * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {inspection.notes && (
              <div>
                <div className="telemetry text-hazard font-black mb-1">» Inspector Remarks</div>
                <div className="font-mono text-xs border border-ink p-3 bg-substrate text-ink italic leading-normal">
                  "{inspection.notes}"
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-ink">
            <div className="telemetry text-[10px] opacity-60 font-bold">VERIFICATION DESK DECISION</div>
            
            <textarea
              placeholder="Add administrative comments, rejection reasons or clarification requirements here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="telemetry w-full h-24 bg-substrate border-ink border p-3 text-ink text-xs outline-none"
            />

            <div className="grid grid-cols-3 gap-2">
              <Button
                disabled={submitting}
                onClick={() => handleAction("APPROVED")}
                className="telemetry text-[10px] h-12 bg-green-600 hover:bg-green-700 text-white font-bold cursor-pointer"
              >
                Approve
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleAction("REJECTED")}
                className="telemetry text-[10px] h-12 bg-hazard hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Reject
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleAction("CLARIFICATION")}
                className="telemetry text-[10px] h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
              >
                Clarify
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
