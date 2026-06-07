import { RoleGate } from "@/components/RoleGate";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["INSPECTOR"]}>
      <div className="fixed inset-0 bg-ink grid grid-rows-[auto_1fr] gap-px overflow-hidden select-none">
        <header className="bg-substrate p-4 flex justify-between items-center border-b border-ink">
          <div className="telemetry font-black flex items-center gap-2 text-ink">
            <div className="w-3 h-3 bg-hazard animate-pulse" />
            VERIF-SYS // TERMINAL_01
          </div>
          <div className="flex gap-6 items-center">
            <div className="telemetry hidden sm:block text-[10px] text-ink">
              <span className="opacity-50 mr-1 font-bold">LOC:</span> JKTA-PORT-A
            </div>
            <div className="telemetry hidden sm:block text-[10px] text-ink">
              <span className="opacity-50 mr-1 font-bold">SIGNAL:</span> 100%
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="bg-substrate overflow-auto relative">
          {children}
        </main>
      </div>
    </RoleGate>
  );
}
