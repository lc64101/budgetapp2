import { AccountSettingsPanel } from "@/features/account/AccountSettingsPanel";
import { SocialPanel } from "@/features/social/SocialPanel";
import { ACCOUNT_SYNC_POLICY, SOCIAL_SYNC_POLICY } from "@/lib/sync/policies";

export function DashboardHome() {
  const socialIntervalSeconds = (SOCIAL_SYNC_POLICY.intervalMs ?? 60_000) / 1000;
  const demoUserId = "00000000-0000-0000-0000-000000000001";

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <h1 style={{ marginBottom: 0 }}>Performance-First Budget Platform</h1>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        This foundation enforces strict layer boundaries and a hybrid synchronization model.
      </p>

      <article style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Account Data Sync</h2>
        <p style={{ marginBottom: 0 }}>
          {ACCOUNT_SYNC_POLICY.scope}: {ACCOUNT_SYNC_POLICY.mode}. Writes persist immediately and propagate to concurrent sessions.
        </p>
      </article>

      <article style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Social Data Sync</h2>
        <p style={{ marginBottom: 0 }}>
          {SOCIAL_SYNC_POLICY.scope}: {SOCIAL_SYNC_POLICY.mode} every {socialIntervalSeconds} seconds.
        </p>
      </article>

      <AccountSettingsPanel userId={demoUserId} />
      <SocialPanel userId={demoUserId} />
    </section>
  );
}
