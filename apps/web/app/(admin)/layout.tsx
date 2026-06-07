import { RoleGate } from "@/components/RoleGate";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="fixed inset-0 bg-ink grid grid-rows-[auto_1fr] gap-px overflow-hidden select-none">
        {/* Top Navigation / Header */}
        <header className="bg-substrate p-4 flex justify-between items-center border-b border-ink">
          <div className="telemetry font-black flex items-center gap-2 text-ink">
            <div className="w-3 h-3 bg-ink" />
            VERIF-SYS // ADMIN_CENTER
          </div>
          <div className="flex gap-6 items-center">
            <div className="telemetry hidden sm:block text-[10px] text-ink font-bold">
              AUTH_LEVEL: ROOT
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-px bg-ink overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="bg-substrate flex flex-col gap-px">
            <nav className="flex flex-col">
              <div className="p-4 telemetry text-[10px] opacity-50 font-bold border-b border-ink">
                NAVIGATION_MENU
              </div>
              <a href="/admin" className="p-4 telemetry hover:bg-ink hover:text-substrate transition-colors border-b border-ink font-bold">
                » Dashboard
              </a>
              <a href="/admin/users" className="p-4 telemetry hover:bg-ink hover:text-substrate transition-colors border-b border-ink font-bold">
                » User Management
              </a>
              <a href="/admin/logs" className="p-4 telemetry hover:bg-ink hover:text-substrate transition-colors border-b border-ink font-bold">
                » System Logs
              </a>
              <div className="mt-auto p-4 telemetry text-[10px] opacity-30 border-t border-ink font-bold">
                SYS_VER: 1.0.4-STABLE
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="bg-substrate overflow-auto relative p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
