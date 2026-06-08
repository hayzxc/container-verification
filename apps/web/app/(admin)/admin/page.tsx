"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/features/auth/auth.api";
import { listInspectionsApi } from "@/features/inspections/inspections.api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeInspectors: 0,
    systemHealth: "100%",
    dailyThroughput: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all inspections to compute throughput and filter pending
      const res = await listInspectionsApi({ limit: 100 });
      if (res.success) {
        const items = res.data;
        const pending = items.filter((x: any) => x.status === "PENDING" || x.status === "pending");
        setPendingList(pending);

        // Deduplicate inspectors
        const uniqueInspectors = new Set(items.map((x: any) => x.inspectorId)).size;

        setStats({
          pendingCount: pending.length,
          activeInspectors: uniqueInspectors || 1,
          systemHealth: "OK",
          dailyThroughput: items.length,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to fetch admin dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogout() {
    try {
      await logoutApi();
    } catch (e) {}
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-px bg-ink border-b border-ink -mx-8 -mt-8 mb-8">
        <div className="bg-substrate p-8 sm:p-12">
          <h1 className="macro-type text-ink">ADMIN_CENTER</h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
            <p className="telemetry text-ink">
              <span className="opacity-50 font-bold">OPERATOR:</span> {user?.fullName}
            </p>
            <p className="telemetry text-ink">
              <span className="opacity-50 font-bold">ACCESS:</span> ROOT_ADMIN
            </p>
          </div>
        </div>
        <div className="bg-substrate p-8 sm:p-12 flex items-center justify-center">
          <Button variant="outline" size="lg" onClick={handleLogout} className="telemetry w-full sm:w-auto">
            Terminate Session
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink border border-ink mb-8">
        {[
          { label: "Pending Verification", value: stats.pendingCount.toString().padStart(2, "0"), trend: "Awaiting Action" },
          { label: "Active Inspectors", value: stats.activeInspectors.toString().padStart(2, "0"), trend: "Active Depot Staff" },
          { label: "System Health", value: stats.systemHealth, trend: "Service Online" },
          { label: "Daily Throughput", value: stats.dailyThroughput.toString().padStart(2, "0"), trend: "Total Sessions" },
        ].map((stat) => (
          <div key={stat.label} className="bg-substrate p-6">
            <div className="telemetry text-[10px] opacity-50 mb-2 font-bold">{stat.label}</div>
            <div className="text-4xl font-black text-ink">{stat.value}</div>
            <div className="telemetry text-[10px] mt-2 text-hazard font-bold">{stat.trend}</div>
          </div>
        ))}
      </div>

      {/* Verification Queue Section */}
      <div className="space-y-4">
        <div className="telemetry font-black text-ink">» Pending Verification Queue</div>
        
        {loading ? (
          <div className="telemetry text-center py-12 bg-substrate border border-ink">Loading queue...</div>
        ) : error ? (
          <div className="telemetry text-center text-hazard py-12 bg-substrate border border-ink">{error}</div>
        ) : pendingList.length === 0 ? (
          <div className="telemetry text-center py-12 bg-substrate border border-ink opacity-60">
            No inspections require verification. Good job!
          </div>
        ) : (
          <div className="border border-ink bg-ink grid grid-cols-1 gap-px">
            {pendingList.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/admin/verification/${item.id}`)}
                className="bg-substrate p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-ink hover:text-substrate transition-colors"
              >
                <div>
                  <div className="text-xl font-bold font-mono tracking-tight">{item.containerId}</div>
                  <div className="flex flex-wrap gap-x-6 mt-1 text-[10px] telemetry opacity-60 font-bold">
                    <span>INSPECTOR: {item.inspector?.fullName || item.inspectorId}</span>
                    <span>TYPE: {item.inspectionType}</span>
                    <span>DEPOT: {item.locationName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <span className="telemetry text-[10px] opacity-40 font-bold">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <Button variant="outline" size="sm" className="telemetry ml-auto md:ml-0">
                    Verify »
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
