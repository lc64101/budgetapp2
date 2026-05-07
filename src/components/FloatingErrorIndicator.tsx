"use client";

import { useState } from "react";

interface FloatingErrorIndicatorProps {
  message: string | null;
  onDismiss?: () => void;
  bottomOffset?: string;
}

export function FloatingErrorIndicator({
  message,
  onDismiss,
  bottomOffset = "calc(82px + env(safe-area-inset-bottom))",
}: FloatingErrorIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!message) {
    return null;
  }

  return (
    <div className="floating-error-wrap" style={{ bottom: bottomOffset }}>
      {isOpen ? (
        <div className="floating-error-popover" role="alert" aria-live="assertive">
          <p>{message}</p>
          <button
            type="button"
            className="floating-error-dismiss"
            onClick={() => {
              setIsOpen(false);
              onDismiss?.();
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="floating-error-btn"
        aria-label="Open error details"
        onClick={() => setIsOpen((current) => !current)}
      >
        !
      </button>
    </div>
  );
}
