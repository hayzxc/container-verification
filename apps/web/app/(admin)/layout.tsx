import { RoleGate } from "@/components/RoleGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="min-h-screen flex bg-background">
        <aside className="w-64 bg-primary text-white p-4 hidden md:block">
          <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
          <nav className="flex flex-col gap-2">
            <a href="/admin" className="p-2 bg-white/10 rounded">Overview</a>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </RoleGate>
  );
}
