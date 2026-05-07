"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface QuickPreferences {
  offlineMode: boolean;
  sharingEnabled: boolean;
  notificationsPreview: boolean;
}

const STORAGE_KEY = "budgetapp.quick-preferences";
const STORAGE_EVENT = "budgetapp.quick-preferences-change";

const DEFAULT_PREFERENCES: QuickPreferences = {
  offlineMode: false,
  sharingEnabled: false,
  notificationsPreview: false,
};

function parseQuickPreferences(rawValue: string | null): QuickPreferences {
  if (!rawValue) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<QuickPreferences>;
    return {
      offlineMode: Boolean(parsed.offlineMode),
      sharingEnabled: Boolean(parsed.sharingEnabled),
      notificationsPreview: Boolean(parsed.notificationsPreview),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// Module-level cache so getSnapshot returns a stable reference when data is unchanged
let _cachedRaw: string | null = undefined as unknown as string | null;
let _cachedSnapshot: QuickPreferences = DEFAULT_PREFERENCES;

function getStableSnapshot(): QuickPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== _cachedRaw) {
    _cachedRaw = raw;
    _cachedSnapshot = parseQuickPreferences(raw);
  }
  return _cachedSnapshot;
}

export function useQuickPreferences() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) {
        onStoreChange();
      }
    };
    const handleLocalChange = () => {
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_EVENT, handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_EVENT, handleLocalChange);
    };
  }, []);

  const preferences = useSyncExternalStore(subscribe, getStableSnapshot, () => DEFAULT_PREFERENCES);

  const updatePreferences = useCallback((next: Partial<QuickPreferences>) => {
    if (typeof window === "undefined") {
      return;
    }

    // Read current snapshot directly from the store (not from the closed-over
    // `preferences` value) to avoid `preferences` in the dep array, which would
    // recreate this callback on every store update and cause an infinite loop.
    const current = getStableSnapshot();
    const merged: QuickPreferences = { ...current, ...next };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  return {
    preferences,
    updatePreferences,
    isReady: true,
  };
}
