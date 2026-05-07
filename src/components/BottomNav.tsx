"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/calculator", icon: "🧮", label: "Calculator" },
  { href: "/budget", icon: "💰", label: "Budget" },
  { href: "/social", icon: "🤝", label: "Social" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/calculator"
            ? pathname.startsWith("/calculator")
            : tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link key={tab.href} href={tab.href} className={`bottom-tab${isActive ? " active" : ""}`}>
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
