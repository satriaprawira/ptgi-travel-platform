"use client";

import { useId, useRef, type ReactNode } from "react";
import type { Policy } from "@/lib/content";

/** A text link that opens a full policy (luggage guide, pet policy) in a modal dialog. */
export default function PolicyLink({ policy, children }: { policy: Policy; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className="policy-link" onClick={() => dialog.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialog}
        className="policy-dialog"
        aria-labelledby={titleId}
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="policy-dialog-body">
          <div className="policy-dialog-head">
            <h2 id={titleId}>{policy.title}</h2>
            <button type="button" className="policy-dialog-close" onClick={close} aria-label="Close">
              &times;
            </button>
          </div>
          <p>{policy.intro}</p>
          <ol>
            {policy.sections.map((section) => (
              <li key={section.title}>
                <h3>{section.title}</h3>
                {section.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </li>
            ))}
          </ol>
          {policy.outro && <p>{policy.outro}</p>}
          <button type="button" className="policy-dialog-done" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
