"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Space kept between the bubble and the edge of the screen. */
const EDGE_GAP = 12;

/**
 * A small ⓘ button that shows a short note. Opens on hover and keyboard focus, and on tap for touch
 * screens; Escape, moving away or tapping elsewhere closes it. Put it next to a label, not inside
 * one, so the input's name stays clean.
 */
export default function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const bubble = useRef<HTMLSpanElement>(null);

  // A tip near the right edge (e.g. the last of three columns on a phone) slides left to stay on screen.
  useLayoutEffect(() => {
    const el = bubble.current;
    if (!open || !el) return;
    const overflow = el.getBoundingClientRect().right - (document.documentElement.clientWidth - EDGE_GAP);
    if (overflow > 0) el.style.transform = `translateX(-${Math.ceil(overflow)}px)`;
  }, [open]);

  return (
    <span className="info-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="info-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        // A tap also focuses the button (which opens it), so a click only ever opens; blur closes.
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 11v6M12 7.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <span ref={bubble} role="tooltip" id={id} className="info-tip-bubble">
          {children}
        </span>
      )}
    </span>
  );
}
