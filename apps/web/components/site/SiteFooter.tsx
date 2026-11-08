import type { ReactNode } from "react";
import {
  COMPANY_NAME,
  CONTACT,
  COPYRIGHT,
  LIVE_CHAT_NOTE,
  OFFICES,
  SOCIAL_LINKS,
  SUPPORT_NOTE,
  WHATSAPP_URL,
  type Office,
} from "@/lib/content";
import styles from "./Site.module.css";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Keeps numbers like "3-13-4" on one line instead of breaking at a hyphen. */
function keepNumbersTogether(text: string) {
  return text.split(/(\d+(?:-\d+)+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className={styles.nowrap}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Address({ office }: { office: Office }) {
  if (!office.emphasis) return <>{keepNumbersTogether(office.address)}</>;
  const [before, after] = office.address.split(office.emphasis);
  return (
    <>
      {keepNumbersTogether(before)}
      <strong>{office.emphasis}</strong>
      {keepNumbersTogether(after)}
    </>
  );
}

const SOCIAL_ICONS: Record<(typeof SOCIAL_LINKS)[number]["name"], ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="30" height="30" rx="9" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="32.5" cy="15.5" r="2" fill="currentColor" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="currentColor" />
      <path
        className={styles.socialCutout}
        d="M26.4 38V26.7h3.8l.6-4.4h-4.4v-2.8c0-1.3.4-2.1 2.2-2.1H31v-3.9c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 5.9v3.1h-3.8v4.4h3.8V38h4.5z"
      />
    </svg>
  ),
  Threads: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="currentColor" />
      <path
        className={styles.socialCutout}
        d="M29.6 22.9c-.1-.1-.3-.1-.4-.2-.2-4.1-2.5-6.4-6.2-6.4-2.3 0-4.2 1-5.4 2.8l2.1 1.4c.9-1.3 2.2-1.6 3.3-1.6 1.3 0 2.2.4 2.8 1.1.4.5.7 1.2.8 2.1-1.1-.2-2.3-.2-3.5-.2-3.6.2-5.9 2.3-5.7 5.2.1 1.5.8 2.8 2.1 3.6 1.1.7 2.4 1 3.8 1 1.9-.1 3.3-.8 4.3-2.1.8-1 1.3-2.2 1.5-3.8.9.5 1.5 1.2 1.9 2 .6 1.4.6 3.7-1.3 5.6-1.6 1.6-3.6 2.3-6.6 2.4-3.3 0-5.8-1.1-7.4-3.2-1.5-1.9-2.3-4.7-2.3-8.2s.8-6.3 2.3-8.2c1.6-2.1 4.1-3.1 7.4-3.2 3.3 0 5.9 1.1 7.6 3.2.8 1 1.5 2.3 1.9 3.8l2.5-.7c-.5-1.9-1.3-3.5-2.4-4.8-2.2-2.7-5.4-4.1-9.5-4.1h-.1c-4.1 0-7.3 1.4-9.4 4.1-1.9 2.4-2.9 5.8-2.9 9.9s1 7.5 2.9 9.9c2.1 2.7 5.3 4.1 9.4 4.1h.1c3.6 0 6.2-1 8.3-3.1 2.8-2.8 2.7-6.3 1.8-8.4-.7-1.6-1.9-2.8-3.6-3.6zm-6.2 5.9c-1.5.1-3.1-.6-3.2-2.1-.1-1.1.8-2.4 3.4-2.5h.9c.9 0 1.8.1 2.6.3-.3 3.7-2 4.2-3.7 4.3z"
      />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 7C14.6 7 7 14.4 7 23.6c0 3.2.9 6.2 2.6 8.8L7.4 40l7.9-2.4c2.5 1.4 5.6 2.2 8.7 2.2 9.4 0 17-7.4 17-16.6S33.4 7 24 7z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M31.8 27.4c-.4-.2-2.4-1.2-2.8-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.5-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.3-2-1.2-1.1-2-2.4-2.3-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3 0-.5 0-.7l-1.3-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.5s1.5 4 1.7 4.3c.2.3 3 4.6 7.3 6.4 1 .4 1.8.7 2.4.9 1 .3 1.9.3 2.6.2.8-.1 2.4-1 2.8-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"
        fill="currentColor"
      />
    </svg>
  ),
};

/** Customer site footer: offices, contact details, customer support, social links and copyright. */
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.footerTitle}>{COMPANY_NAME}</h2>

      <div className={styles.offices}>
        <div className={styles.office}>
          <h3>{OFFICES.head.name}</h3>
          <p>
            <Address office={OFFICES.head} />
          </p>
          <h4>{OFFICES.osaka.name}</h4>
          <p>
            <Address office={OFFICES.osaka} />
          </p>
        </div>
        <div className={`${styles.office} ${styles.officeCentered}`}>
          <h3>{OFFICES.narita.name}</h3>
          <p>
            <Address office={OFFICES.narita} />
          </p>
        </div>
        <div className={styles.office}>
          <h3>{OFFICES.indonesia.name}</h3>
          <p className={styles.company}>{OFFICES.indonesia.company}</p>
          <p>
            <Address office={OFFICES.indonesia} />
          </p>
        </div>
      </div>

      <p className={styles.contactLines}>
        Chat Only&nbsp; :{" "}
        <a href={WHATSAPP_URL} {...EXTERNAL}>
          {CONTACT.chat}
        </a>
        <br />
        Fax : {CONTACT.fax}
      </p>

      <h3 className={styles.support}>Customer Support</h3>
      <p className={styles.supportNote}>{SUPPORT_NOTE}</p>
      <ul className={styles.emails}>
        {CONTACT.emails.map((email) => (
          <li key={email}>
            Email : <a href={`mailto:${email}`}>{email}</a>
          </li>
        ))}
      </ul>
      <a className={styles.liveChat} href={WHATSAPP_URL} {...EXTERNAL}>
        {LIVE_CHAT_NOTE}
      </a>

      <div className={styles.footerBottom}>
        <ul className={styles.socials}>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.name}>
              <a href={link.href} {...EXTERNAL} aria-label={link.name} title={link.name}>
                {SOCIAL_ICONS[link.name]}
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.copyright}>{COPYRIGHT}</p>
      </div>
    </footer>
  );
}
