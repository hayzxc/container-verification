"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/features/auth/auth.api";
import { listInspectionsApi } from "@/features/inspections/inspections.api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllDrafts, getSyncLogs, clearSyncLogs, type OfflineInspectionDraft, type OfflineSyncLog } from "@/lib/indexed-db";
import { syncOfflineQueue } from "@/lib/offline-sync";

export default function InspectorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string>("");
  const [inspections, setInspections] = useState<any[]>([]);
  const [localDrafts, setLocalDrafts] = useState<OfflineInspectionDraft[]>([]);
  const [syncLogs, setSyncLogs] = useState<OfflineSyncLog[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setNodeId(Math.random().toString(36).substring(7).toUpperCase());
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Load offline drafts
      const drafts = await getAllDrafts();
      setLocalDrafts(drafts.filter((d) => d.status !== "SYNCED"));

      // Load sync logs
      const logs = await getSyncLogs();
      setSyncLogs(logs.slice(-5).reverse()); // last 5 logs

      // Load real inspections if online
      if (navigator.onLine) {
        const res = await listInspectionsApi({ limit: 10 });
        if (res.success) {
          setInspections(res.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOnline]);

  async function handleLogout() {
    try {
      await logoutApi();
    } catch (e) {}
    logout();
    router.push("/login");
  }

  async function handleSync() {
    setSyncing(true);
    await syncOfflineQueue();
    await loadData();
    setSyncing(false);
  }

  async function handleClearLogs() {
    await clearSyncLogs();
    await loadData();
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-hazard text-white p-3 text-center telemetry font-bold animate-pulse">
          ⚠️ OFFLINE MODE ACTIVE // LOCAL STORAGE MODE ENABLED
        </div>
      )}

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-px bg-ink border-b border-ink">
        <div className="bg-substrate p-8 sm:p-12">
          <h1 className="macro-type text-ink">INSPECTOR</h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
            <p className="telemetry text-ink">
              <span className="opacity-50 font-bold">OPERATOR:</span> {user?.fullName}
            </p>
            <p className="telemetry text-ink">
              <span className="opacity-50 font-bold">ID:</span> {user?.id.slice(0, 8)}
            </p>
            <p className="telemetry text-ink">
              <span className="opacity-50 font-bold">CLEARANCE:</span> LEVEL_02
            </p>
          </div>
        </div>
        <div className="bg-substrate p-8 sm:p-12 flex items-center justify-center">
          <Button variant="outline" size="lg" onClick={handleLogout} className="telemetry w-full sm:w-auto">
            Terminate Session
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink">
        {/* Actions & Sync Panel */}
        <div className="bg-substrate p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="telemetry mb-6 text-hazard font-black">» Start Operation</div>
            <Button
              size="lg"
              onClick={() => router.push("/inspector/inspections/new")}
              className="w-full h-40 text-3xl font-black bg-accent hover:bg-ink text-white border-ink cursor-pointer"
            >
              NEW INSPECTION
            </Button>
          </div>

          <div className="mt-8 border border-ink p-6 bg-substrate">
            <div className="flex justify-between items-center mb-4">
              <span className="telemetry font-bold text-ink">Offline Sync Status</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing || !isOnline || localDrafts.length === 0}
                className="telemetry text-[10px]"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-px bg-ink border border-ink mb-4">
              <div className="bg-substrate p-4">
                <div className="telemetry text-[10px] opacity-50 mb-1 font-bold">Queued Drafts</div>
                <div className="telemetry text-ink font-bold text-lg">{localDrafts.length}</div>
              </div>
              <div className="bg-substrate p-4">
                <div className="telemetry text-[10px] opacity-50 mb-1 font-bold">Connection</div>
                <div className={`telemetry font-bold text-lg ${isOnline ? "text-green-600" : "text-hazard"}`}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </div>
              </div>
            </div>

            {syncLogs.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="telemetry text-[10px] opacity-50 font-bold">Sync Activity Logs</span>
                  <button onClick={handleClearLogs} className="telemetry text-[9px] underline opacity-50 hover:opacity-100">
                    Clear Logs
                  </button>
                </div>
                <div className="font-mono text-[10px] bg-black text-green-400 p-3 overflow-y-auto max-h-28 rounded-none border border-ink">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="mb-1 leading-tight">
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.type}: {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History / Drafts Panel */}
        <div className="bg-substrate p-8 sm:p-12">
          {localDrafts.length > 0 && (
            <div className="mb-8">
              <div className="telemetry mb-4 text-hazard font-black">» Local Pending Drafts</div>
              <div className="grid grid-cols-1 gap-px bg-ink border border-ink">
                {localDrafts.map((draft) => (
                  <div key={draft.localId} className="bg-substrate p-4 flex justify-between items-center">
                    <div>
                      <div className="telemetry font-bold">{draft.containerId || "UNNAMED DRAFT"}</div>
                      <div className="telemetry text-[10px] opacity-50 font-bold">
                        {draft.inspectionType} // {draft.locationName}
                      </div>
                    </div>
                    <div className="telemetry font-black text-hazard">{draft.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="telemetry mb-4 font-black flex justify-between text-ink">
            <span>Recent Submitted Logs</span>
            <span className="opacity-50">Total: {inspections.length}</span>
          </div>

          {loading ? (
            <div className="telemetry text-center py-8">Loading verification records...</div>
          ) : error ? (
            <div className="telemetry text-center text-hazard py-8">{error}</div>
          ) : inspections.length === 0 ? (
            <div className="telemetry text-center py-8 opacity-50">No recent submissions found</div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-ink border border-ink">
              {inspections.map((log) => (
                <div
                  key={log.id}
                  onClick={() => router.push(`/inspector/inspections/${log.id}`)}
                  className="bg-substrate p-4 flex justify-between items-center group cursor-pointer hover:bg-ink hover:text-substrate transition-colors"
                >
                  <div>
                    <div className="telemetry font-bold">{log.containerId}</div>
                    <div className="telemetry text-[10px] opacity-50 font-bold">
                      {new Date(log.createdAt).toLocaleDateString()} // {log.locationName}
                    </div>
                  </div>
                  <div
                    className={`telemetry font-black ${
                      log.status === "REJECTED"
                        ? "text-hazard"
                        : log.status === "APPROVED"
                        ? "text-green-600"
                        : "text-amber-500"
                    }`}
                  >
                    {log.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="bg-substrate border-t border-ink p-4 flex justify-between items-center">
        <div className="telemetry text-[9px] opacity-40 font-bold text-ink">
          PROPRIETARY SYSTEM // DO NOT DISCLOSE
        </div>
        <div className="telemetry text-[9px] opacity-40 font-bold text-ink">
          SECURE_NODE: {nodeId || "LOADING..."}
        </div>
      </footer>
    </div>
  );
}
