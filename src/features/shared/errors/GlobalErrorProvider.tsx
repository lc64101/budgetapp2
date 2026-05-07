"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

interface GlobalErrorContextValue {
  reportError: (message: string) => void;
  clearError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextValue | null>(null);

export function GlobalErrorProvider({ children }: { children: ReactNode }) {
  const lastShownRef = useRef<{ message: string; at: number } | null>(null);

  const reportError = useCallback((nextMessage: string) => {
    const normalized = nextMessage.trim();
    if (!normalized) {
      return;
    }

    const now = Date.now();
    const previous = lastShownRef.current;

    // Avoid rapid duplicate notifications from repeated query retries/renders.
    if (previous && previous.message === normalized && now - previous.at < 2000) {
      return;
    }

    lastShownRef.current = { message: normalized, at: now };
    // Keep reporting available for callers without rendering a global floating popup.
    console.error(normalized);
  }, []);

  const clearError = useCallback(() => undefined, []);

  const value = useMemo<GlobalErrorContextValue>(
    () => ({
      reportError,
      clearError,
    }),
    [clearError, reportError],
  );

  return (
    <GlobalErrorContext.Provider value={value}>
      {children}
    </GlobalErrorContext.Provider>
  );
}

export function useGlobalError() {
  const context = useContext(GlobalErrorContext);

  if (!context) {
    throw new Error("useGlobalError must be used inside GlobalErrorProvider");
  }

  return context;
}
