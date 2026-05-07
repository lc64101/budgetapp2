import type { ReactNode } from "react";
import { MainAppShell } from "@/components/MainAppShell";
import { AuthGuard } from "@/features/account/AuthGuard";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <MainAppShell>{children}</MainAppShell>
    </AuthGuard>
  );
}
