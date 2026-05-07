"use client";

import Link from "next/link";
import { AccountProfilePanel } from "@/features/account/AccountProfilePanel";
import { AccountSettingsPanel } from "@/features/account/AccountSettingsPanel";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import { useQuickPreferences } from "@/features/settings/useQuickPreferences";

export default function SettingsPage() {
  const { userId, isLoading, error } = useCurrentUser();
  const { preferences, updatePreferences, isReady } = useQuickPreferences();

  if (isLoading) {
    return <div className="app-loading">Loading settings...</div>;
  }

  if (error || !userId) {
    return <div className="app-loading">Unable to load account settings.</div>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Control account preferences, privacy switches, and dashboard behavior.</p>
      </div>

      <div className="grid">
        <article className="card stat-card">
          <span className="stat-label">Sync Status</span>
          <span className="stat-value">Realtime</span>
          <span className="stat-helper">Profile and layout settings sync to all signed-in devices.</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Notification Preview</span>
          <span className="stat-value">{preferences.notificationsPreview ? "Enabled" : "Disabled"}</span>
          <span className="stat-helper">Barebones development preview only in this release.</span>
        </article>
      </div>

  <AccountProfilePanel userId={userId} />
      <AccountSettingsPanel userId={userId} />

      <article className="card list-card">
        <h2 className="calc-section-title">Privacy & Connectivity</h2>
        <label className="quick-switch-row">
          <span>
            <b>Offline mode</b>
            <small>Queue local changes and sync after reconnect.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.offlineMode}
            disabled={!isReady}
            onChange={(event) => updatePreferences({ offlineMode: event.target.checked })}
          />
        </label>
        <label className="quick-switch-row">
          <span>
            <b>Social sharing</b>
            <small>Enable social pages and leaderboard participation.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.sharingEnabled}
            disabled={!isReady}
            onChange={(event) => updatePreferences({ sharingEnabled: event.target.checked })}
          />
        </label>
        <label className="quick-switch-row">
          <span>
            <b>Notification preview</b>
            <small>Show development preview for future notification controls.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.notificationsPreview}
            disabled={!isReady}
            onChange={(event) => updatePreferences({ notificationsPreview: event.target.checked })}
          />
        </label>
      </article>

      <article className="card list-card">
        <h2 className="calc-section-title">Dashboard Personalization</h2>
        <div className="list-item">
          <div>
            <span className="list-title">Tile layout sync</span>
            <span className="list-subtle">Layout edits persist per user and sync between devices.</span>
          </div>
          <span className="chip">Enabled</span>
        </div>
        <div className="list-item">
          <div>
            <span className="list-title">Modular tiles</span>
            <span className="list-subtle">Drag, resize, and metric catalog controls are in progress.</span>
          </div>
          <span className="chip">In progress</span>
        </div>
        <div className="dashboard-actions">
          <Link href="/" className="btn btn-primary">
            Open Dashboard Customizer
          </Link>
        </div>
      </article>
    </section>
  );
}
