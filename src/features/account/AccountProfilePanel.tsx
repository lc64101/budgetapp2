"use client";

import { useEffect, useState } from "react";
import { useAccountProfile, useUsernameAvailability } from "@/features/account/useAccountProfile";
import { validateUsername } from "@/services/auth/AuthIdentityService";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";

export function AccountProfilePanel({ userId }: { userId: string }) {
  const { reportError } = useGlobalError();
  const { data, error, isLoading, updateUsername, isSavingUsername } = useAccountProfile(userId);
  const [draftUsername, setDraftUsername] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const currentUsername = data?.username ?? "";
  const usernameValue = draftUsername ?? currentUsername;
  const normalizedDraft = usernameValue.trim().toLowerCase();
  const validationError = validateUsername(normalizedDraft);
  const needsAvailabilityCheck = Boolean(
    normalizedDraft && normalizedDraft !== currentUsername && !validationError,
  );
  const availability = useUsernameAvailability(userId, normalizedDraft, needsAvailabilityCheck);

  useEffect(() => {
    if (!error) {
      return;
    }

    reportError(`Failed to load account profile: ${error.message}`);
  }, [error, reportError]);

  useEffect(() => {
    if (!availability.error) {
      return;
    }

    reportError(`Failed to check username availability: ${availability.error.message}`);
  }, [availability.error, reportError]);

  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  return (
    <article className="card list-card">
      <h2 className="calc-section-title">Profile</h2>
      <p className="muted">Change the unique username used for login and social features.</p>

      <div className="form-group">
        <label htmlFor="settings-username">Username</label>
        <input
          id="settings-username"
          type="text"
          value={usernameValue}
          disabled={isSavingUsername}
          onChange={(event) => {
            setStatus("");
            setDraftUsername(event.target.value.toLowerCase());
          }}
          placeholder="username"
          autoComplete="username"
        />
      </div>

      <p className="muted">3-24 lowercase letters, numbers, or underscores.</p>
      {normalizedDraft === currentUsername ? <p className="muted">Current username.</p> : null}
      {normalizedDraft !== currentUsername && validationError ? <p className="muted">{validationError}</p> : null}
      {needsAvailabilityCheck && availability.isFetching ? <p className="muted">Checking availability...</p> : null}
      {needsAvailabilityCheck && availability.data?.available ? <p className="muted">Username is available.</p> : null}
      {needsAvailabilityCheck && availability.data && !availability.data.available && availability.data.reason ? (
        <p className="muted">{availability.data.reason}</p>
      ) : null}

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn"
          disabled={isSavingUsername || !data}
          onClick={() => {
            setStatus("");
            setDraftUsername(null);
          }}
        >
          Revert
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={
            isSavingUsername ||
            !normalizedDraft ||
            normalizedDraft === currentUsername ||
            Boolean(validationError) ||
            (needsAvailabilityCheck && !availability.data?.available)
          }
          onClick={async () => {
            setStatus("");
            try {
              const profile = await updateUsername(normalizedDraft);
              setDraftUsername(profile.username);
              setStatus("Username updated.");
            } catch (caught) {
              reportError(caught instanceof Error ? caught.message : "Failed to update username");
            }
          }}
        >
          {isSavingUsername ? "Saving..." : "Save Username"}
        </button>
      </div>

      {status ? <p className="muted">{status}</p> : null}
    </article>
  );
}