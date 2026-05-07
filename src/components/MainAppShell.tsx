"use client";

import { useEffect, type ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAccountSettings } from "@/features/account/useAccountSettings";
import { useCurrentUser } from "@/features/account/useCurrentUser";

export function MainAppShell({ children }: { children: ReactNode }) {
  const { userId } = useCurrentUser();
  const { data } = useAccountSettings(userId ?? "");

  const today = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = data?.darkMode ? "dark" : "light";
  }, [data?.darkMode]);

  return (
    <div className="app">
      <header className="mobile-header">
        <div className="header-brand">
          <span className="brand-mark">Penny Clipper</span>
          <span className="brand-subtitle">Stay calm, spend with intention.</span>
          <div className="header-meta">
            <span className="meta-pill">On track</span>
            <span className="header-date">{today}</span>
          </div>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  );
}
