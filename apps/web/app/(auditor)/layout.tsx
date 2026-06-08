import { RoleGate } from "@/components/RoleGate";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["AUDITOR", "ADMIN"]}>
      <div className="fixed inset-0 bg-ink grid grid-rows-[auto_1fr] gap-px overflow-hidden select-none">
        <header className="bg-substrate p-4 flex justify-between items-center border-b border-ink">
          <div className="telemetry font-black flex items-center gap-2 text-ink">
            <div className="w-3 h-3 bg-green-600" />
            VERIF-SYS // ARCHIVE_AUDIT
          </div>
          <div className="flex gap-6 items-center">
            <div className="telemetry hidden sm:block text-[10px] text-ink font-bold">
              SYS_MODE: INVENTORY_READ_ONLY
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="bg-substrate overflow-auto relative p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </RoleGate>
  );
}
