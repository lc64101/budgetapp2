import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/design-system/AppShell";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Budget App 2",
  description: "High-performance budget app with hybrid sync",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
