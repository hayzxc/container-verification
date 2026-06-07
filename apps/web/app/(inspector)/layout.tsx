import { RoleGate } from "@/components/RoleGate";

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["INSPECTOR"]}>
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-surface shadow-sm border-x">
        {children}
      </div>
    </RoleGate>
  );
}
