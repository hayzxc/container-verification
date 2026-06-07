"use client";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/features/auth/auth.api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InspectorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string>("");

  useEffect(() => {
    setNodeId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);

  async function handleLogout() {
    try { await logoutApi(); } catch (e) {}
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-col min-h-full">
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
        {/* Actions Panel */}
        <div className="bg-substrate p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="telemetry mb-6 text-hazard font-black">» Start Operation</div>
            <Button size="lg" className="w-full h-40 text-3xl font-black bg-accent hover:bg-ink border-ink">
              NEW INSPECTION
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-px bg-ink border border-ink">
            <div className="bg-substrate p-4">
              <div className="telemetry text-[10px] opacity-50 mb-1 font-bold">Optical Unit</div>
              <div className="telemetry text-ink font-bold">Ready</div>
            </div>
            <div className="bg-substrate p-4">
              <div className="telemetry text-[10px] opacity-50 mb-1 font-bold">Local DB</div>
              <div className="telemetry text-ink font-bold">Synced</div>
            </div>
          </div>
        </div>
        
        {/* History Panel */}
        <div className="bg-substrate p-8 sm:p-12">
          <div className="telemetry mb-6 font-black flex justify-between text-ink">
            <span>Recent Logs</span>
            <span className="opacity-50">Total: 128</span>
          </div>
          
          <div className="grid grid-cols-1 gap-px bg-ink border border-ink">
            {[
              { id: "4492-X", time: "14:20", status: "VERIFIED" },
              { id: "8812-B", time: "12:05", status: "FLAGGED" },
              { id: "1029-C", time: "09:44", status: "VERIFIED" },
            ].map((log) => (
              <div key={log.id} className="bg-substrate p-4 flex justify-between items-center group cursor-pointer hover:bg-ink hover:text-substrate transition-colors">
                <div>
                  <div className="telemetry font-bold">{log.id}</div>
                  <div className="telemetry text-[10px] opacity-50 font-bold">{log.time} // UTC+7</div>
                </div>
                <div className={`telemetry font-black ${log.status === "FLAGGED" ? "text-hazard group-hover:text-hazard" : "group-hover:text-substrate"}`}>
                  {log.status}
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-4 telemetry text-[10px] h-8 border-ink">
            View All Historical Records
          </Button>
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
