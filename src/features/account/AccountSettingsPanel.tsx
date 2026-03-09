"use client";

import { useAccountSettings } from "@/features/account/useAccountSettings";
import { useAccountRealtimeInvalidation } from "@/features/shared/sync/useAccountRealtimeInvalidation";

export function AccountSettingsPanel({ userId }: { userId: string }) {
  const { data, error, isLoading, updateSettings, isSaving } = useAccountSettings(userId);
  useAccountRealtimeInvalidation({ userId, queryKeyPrefix: ["account-settings", userId] });

  if (isLoading) {
    return <p>Loading account settings...</p>;
  }

  if (error) {
    return <p>Failed to load account settings: {error.message}</p>;
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

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        Pay frequency
        <select
          value={data?.payFrequency ?? "monthly"}
          disabled={isSaving || !data}
          onChange={(event) =>
            updateSettings({
              darkMode: data?.darkMode ?? false,
              payFrequency: event.target.value as "weekly" | "fortnightly" | "monthly",
            })
          }
        >
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <p style={{ marginBottom: 0, color: "var(--muted)" }}>{isSaving ? "Saving change..." : "Changes save instantly."}</p>
    </section>
  );
}
