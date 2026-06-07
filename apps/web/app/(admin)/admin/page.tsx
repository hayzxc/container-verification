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
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex items-center gap-4">
          <span>{user?.fullName}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface border rounded-lg shadow-sm">
          <h3 className="text-muted font-medium">Pending Verification</h3>
          <p className="text-4xl font-bold mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
