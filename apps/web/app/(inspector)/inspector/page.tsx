"use client";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/features/auth/auth.api";
import { useRouter } from "next/navigation";

export default function InspectorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try { await logoutApi(); } catch (e) {}
    logout();
    router.push("/login");
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Hi, {user?.fullName}</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
      </header>
      <main className="flex-1 flex flex-col gap-4">
        <Button size="lg" className="w-full h-16 text-lg bg-accent text-white hover:bg-accent/90">
          Mulai Inspeksi Baru
        </Button>
        <p className="text-muted text-center mt-8">Belum ada inspeksi hari ini.</p>
      </main>
    </div>
  );
}
