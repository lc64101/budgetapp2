"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccountSettings } from "@/features/account/useAccountSettings";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import { useQuickPreferences } from "@/features/settings/useQuickPreferences";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";

interface QuickSettingsPopoverProps {
  onClose: () => void;
}

export function QuickSettingsPopover({ onClose }: QuickSettingsPopoverProps) {
  const router = useRouter();
  const { reportError } = useGlobalError();
  const { userId } = useCurrentUser();
  const { data, isLoading, error, updateSettings, isSaving } = useAccountSettings(userId ?? "");
  const { preferences, updatePreferences, isReady } = useQuickPreferences();

  const statusText = useMemo(() => {
    if (!isReady) {
      return "Loading quick controls...";
    }

    if (preferences.offlineMode) {
      return "Offline mode enabled. Changes queue locally and sync when back online.";
    }

    return "Connected mode. Changes save to cloud in real time.";
  }, [isReady, preferences.offlineMode]);

  const darkModeChecked = Boolean(data?.darkMode);

  useEffect(() => {
    if (!error) {
      return;
    }

    reportError(`Account sync warning: ${error.message}`);
  }, [error, reportError]);

  return (
    <section
      className="quick-settings-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Quick settings"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="quick-settings-header">
        <div>
          <h2>Quick Settings</h2>
          <p className="muted">Toggle common controls without leaving your current page.</p>
        </div>
        <button type="button" className="btn quick-close-btn" onClick={onClose} aria-label="Close quick settings">
          Close
        </button>
      </div>

      <article className="card quick-settings-card">
        <h3 className="quick-settings-title">Appearance</h3>
        <label className="quick-switch-row">
          <span>
            <b>Dark mode</b>
            <small>Applies across the app for this account.</small>
          </span>
          <input
            type="checkbox"
            checked={darkModeChecked}
            disabled={!data || isSaving || isLoading}
            onChange={(event) => {
              if (!data) {
                return;
              }

              void updateSettings({
                darkMode: event.target.checked,
                payFrequency: data.payFrequency,
              });
            }}
          />
        </label>
      </article>

      <article className="card quick-settings-card">
        <h3 className="quick-settings-title">Privacy & Data</h3>
        <label className="quick-switch-row">
          <span>
            <b>Offline mode</b>
            <small>Store edits locally and sync when connection returns.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.offlineMode}
            onChange={(event) => updatePreferences({ offlineMode: event.target.checked })}
          />
        </label>

        <label className="quick-switch-row">
          <span>
            <b>Social sharing</b>
            <small>Allow social features and leaderboard visibility.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.sharingEnabled}
            onChange={(event) => updatePreferences({ sharingEnabled: event.target.checked })}
          />
        </label>

        <label className="quick-switch-row">
          <span>
            <b>Notification preview</b>
            <small>Barebones preview mode for upcoming notification features.</small>
          </span>
          <input
            type="checkbox"
            checked={preferences.notificationsPreview}
            onChange={(event) => updatePreferences({ notificationsPreview: event.target.checked })}
          />
        </label>

        <p className="muted quick-settings-status">{statusText}</p>
      </article>

      <div className="quick-settings-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onClose();
            router.push("/settings");
          }}
        >
          Open Full Settings
        </button>
      </div>
    </section>
  );
}
