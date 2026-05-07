"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import { useSocialData } from "@/features/social/useSocialData";
import { useQuickPreferences } from "@/features/settings/useQuickPreferences";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";

const requireConfirmedEmailForSocial = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION_FOR_SOCIAL === "true";

interface SocialGateState {
  isLoading: boolean;
  isConfirmed: boolean;
  error: string | null;
}

export default function SocialPage() {
  const { userId } = useCurrentUser();
  const { preferences } = useQuickPreferences();
  const { reportError } = useGlobalError();
  const init = useMemo(() => {
    try {
      return { client: createBrowserSupabaseClient(), error: null as string | null };
    } catch (error) {
      return {
        client: null,
        error: error instanceof Error ? error.message : "Supabase client unavailable",
      };
    }
  }, []);

  const [gateState, setGateState] = useState<SocialGateState>({
    isLoading: requireConfirmedEmailForSocial,
    isConfirmed: !requireConfirmedEmailForSocial,
    error: init.error,
  });

  const [targetUsername, setTargetUsername] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    leaderboard,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    isSendingRequest,
    isAcceptingRequest,
  } = useSocialData(preferences.sharingEnabled ? (userId ?? "") : "");

  useEffect(() => {
    if (!requireConfirmedEmailForSocial || !init.client) {
      return;
    }

    let mounted = true;
    const supabase = init.client;

    const updateFromSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      const confirmed = Boolean(data.user?.email_confirmed_at);
      setGateState({
        isLoading: false,
        isConfirmed: confirmed,
        error: error?.message ?? null,
      });
    };

    void updateFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await updateFromSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [init]);

  useEffect(() => {
    if (actionError) {
      reportError(actionError);
    }
  }, [actionError, reportError]);

  useEffect(() => {
    if (leaderboard.error?.message) {
      reportError(leaderboard.error.message);
    }
  }, [leaderboard.error, reportError]);

  useEffect(() => {
    if (friendRequests.error?.message) {
      reportError(friendRequests.error.message);
    }
  }, [friendRequests.error, reportError]);

  if (gateState.isLoading) {
    return <div className="app-loading">Checking confirmation status...</div>;
  }

  if (gateState.error) {
    return <div className="app-loading">{gateState.error}</div>;
  }

  if (!gateState.isConfirmed) {
    return (
      <section className="page">
        <div className="page-header">
          <h1>Social</h1>
          <p className="muted">Leaderboards, accountability circles, and shared wins.</p>
        </div>
        <div className="card highlight-card">
          <p className="muted" style={{ marginBottom: 0 }}>
            Social features are locked until your email is confirmed. Confirm your email, then refresh this page.
          </p>
        </div>
      </section>
    );
  }

  if (!preferences.sharingEnabled) {
    return (
      <section className="page">
        <div className="page-header">
          <h1>Social</h1>
          <p className="muted">Leaderboards, accountability circles, and shared wins.</p>
        </div>
        <div className="card highlight-card">
          <p className="muted" style={{ marginBottom: 0 }}>
            Enable Social Features In Settings to access leaderboards and friend requests.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Social</h1>
        <p className="muted">See how you stack up against friends and keep each other accountable.</p>
      </div>

      <div className="grid">
        <article className="card stat-card">
          <span className="stat-label">Friends Tracked</span>
          <span className="stat-value">{Math.max(0, (leaderboard.data?.length ?? 1) - 1)}</span>
          <span className="stat-helper">Leaderboard includes you and confirmed friends.</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Pending Requests</span>
          <span className="stat-value">{friendRequests.data?.length ?? 0}</span>
          <span className="stat-helper">Accept requests to include friends in ranking.</span>
        </article>
      </div>

      <article className="card calc-card">
        <h2 className="calc-section-title">Add Friend by Username</h2>
        <div className="form-group">
          <label htmlFor="friend-username">Username</label>
          <input
            id="friend-username"
            value={targetUsername}
            onChange={(event) => setTargetUsername(event.target.value)}
            placeholder="friend_username"
          />
        </div>
        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSendingRequest}
            onClick={async () => {
              setActionError("");
              try {
                await sendFriendRequest(targetUsername);
                setTargetUsername("");
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Failed to send friend request");
              }
            }}
          >
            {isSendingRequest ? "Sending..." : "Send Request"}
          </button>
        </div>
      </article>

      <article className="card list-card">
        <h2 className="calc-section-title">Friends Leaderboard</h2>
        {leaderboard.isLoading ? <p className="muted">Loading leaderboard...</p> : null}
        {(leaderboard.data ?? []).map((entry, index) => (
          <div className="list-item" key={entry.userId}>
            <div>
              <span className="list-title">#{index + 1} {entry.username}</span>
              <span className="list-subtle">Spending score {entry.score.toFixed(2)}</span>
            </div>
            <span className="chip">
              {entry.trend === "better" ? "Doing better" : entry.trend === "worse" ? "Doing worse" : "Even"}
            </span>
          </div>
        ))}
      </article>

      <article className="card list-card">
        <h2 className="calc-section-title">Incoming Requests</h2>
        {(friendRequests.data ?? []).length === 0 ? <p className="muted">No pending requests.</p> : null}
        {(friendRequests.data ?? []).map((request) => (
          <div className="list-item" key={request.id}>
            <div>
              <span className="list-title">{request.fromUsername}</span>
              <span className="list-subtle">Requested access to compare budget performance.</span>
            </div>
            <button
              type="button"
              className="btn"
              disabled={isAcceptingRequest}
              onClick={async () => {
                setActionError("");
                try {
                  await acceptFriendRequest(request.id);
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : "Failed to accept friend request");
                }
              }}
            >
              Accept
            </button>
          </div>
        ))}
      </article>
    </section>
  );
}
