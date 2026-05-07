"use client";

import { useEffect } from "react";
import { useAccountSettings } from "@/features/account/useAccountSettings";
import { useAccountRealtimeInvalidation } from "@/features/shared/sync/useAccountRealtimeInvalidation";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";
import { SegmentedPicker } from "@/components/SegmentedPicker";

const PAY_FREQ_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

export function AccountSettingsPanel({ userId }: { userId: string }) {
  const { reportError } = useGlobalError();
  const { data, error, isLoading, updateSettings, isSaving } = useAccountSettings(userId);
  useAccountRealtimeInvalidation({ userId, queryKeyPrefix: ["account-settings", userId] });

  useEffect(() => {
    if (!error) {
      return;
    }

    reportError(`Failed to load account settings: ${error.message}`);
  }, [error, reportError]);

  if (isLoading) {
    return <p>Loading account settings...</p>;
  }

  if (error) {
    return (
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Account Settings (Realtime)</h2>
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>Settings are temporarily unavailable.</p>
      </section>
    );
  }

  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Account Settings (Realtime)</h2>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={Boolean(data?.darkMode)}
          disabled={isSaving || !data}
          onChange={(event) =>
            updateSettings({
              darkMode: event.target.checked,
              payFrequency: data?.payFrequency ?? "monthly",
            })
          }
        />
        Dark mode
      </label>

      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.9rem", color: "var(--muted)" }}>
          Pay frequency
        </p>
        <SegmentedPicker
          value={data?.payFrequency ?? "monthly"}
          options={PAY_FREQ_OPTIONS}
          disabled={isSaving || !data}
          onChange={(v) =>
            updateSettings({
              darkMode: data?.darkMode ?? false,
              payFrequency: v as "weekly" | "fortnightly" | "monthly",
            })
          }
        />
      </div>

      <p style={{ marginBottom: 0, color: "var(--muted)" }}>{isSaving ? "Saving change..." : "Changes save instantly."}</p>
    </section>
  );
}
