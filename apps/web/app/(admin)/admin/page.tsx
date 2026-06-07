"use client";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/features/auth/auth.api";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try { await logoutApi(); } catch (e) {}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink border border-ink">
        {[
          { label: "Pending Verification", value: "12", trend: "+2" },
          { label: "Active Inspectors", value: "08", trend: "0" },
          { label: "System Health", value: "98%", trend: "OK" },
          { label: "Daily Throughput", value: "142", trend: "+12%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-substrate p-6">
            <div className="telemetry text-[10px] opacity-50 mb-2 font-bold">{stat.label}</div>
            <div className="text-4xl font-black text-ink">{stat.value}</div>
            <div className="telemetry text-[10px] mt-2 text-hazard font-bold">{stat.trend}</div>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="mt-8">
        <div className="telemetry mb-4 font-black text-ink">» System_Alerts</div>
        <div className="grid grid-cols-1 gap-px bg-ink border border-ink">
          <div className="bg-substrate p-4 flex items-center gap-4">
            <div className="w-2 h-2 bg-hazard" />
            <div className="telemetry text-xs font-bold">UNAUTHORIZED ACCESS ATTEMPT // NODE_04 // 14:02:11</div>
          </div>
          <div className="bg-substrate p-4 flex items-center gap-4">
            <div className="w-2 h-2 bg-ink" />
            <div className="telemetry text-xs font-bold">BACKUP COMPLETED // CLOUD_STORAGE_01 // 12:00:00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
