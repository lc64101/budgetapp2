import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(90deg, #fffef8 0%, #f3f8f1 100%)",
        }}
      >
        <strong>Budget App 2</strong>
      </header>
      <main style={{ width: "min(1024px, 100%)", margin: "0 auto", padding: "1rem" }}>{children}</main>
    </div>
  );
}
