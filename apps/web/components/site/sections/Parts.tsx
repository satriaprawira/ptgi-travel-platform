import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CTA_BAND, QUOTATION_HREF, WHATSAPP_URL, type Policy, type Screenshot } from "@/lib/content";
import Icon from "./Icon";
import styles from "./Sections.module.css";

export const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Small label, heading and introduction at the top of a section. */
export function SectionHead({
  eyebrow,
  heading,
  lead,
  id,
  center,
  aside,
  className,
}: {
  eyebrow?: string;
  heading: string;
  lead?: string;
  id?: string;
  center?: boolean;
  /** A button on the right (desktop) or below (phone). */
  aside?: ReactNode;
  className?: string;
}) {
  const text = (
    <>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 className={styles.h2} id={id}>
        {heading}
      </h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </>
  );
  return (
    <div
      className={`${styles.secHead} ${center ? styles.center : ""} ${aside ? styles.split : ""} ${className ?? ""}`}
      data-reveal=""
    >
      {aside ? <div>{text}</div> : text}
      {aside}
    </div>
  );
}

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.checks}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ArrowLink({ href, children, external }: { href: string; children: ReactNode; external?: boolean }) {
  if (external) {
    return (
      <a className={styles.textLink} href={href} {...EXTERNAL}>
        {children} <Icon name="external" />
      </a>
    );
  }
  return (
    <Link className={styles.textLink} href={href}>
      {children} <Icon name="arrow" />
    </Link>
  );
}

/** "Ready to book your pickup?" above the footer. afterPaper: the section above has a white background. */
export function CtaBand({ afterPaper }: { afterPaper?: boolean }) {
  return (
    <section className={`${styles.ctaSec} ${afterPaper ? styles.afterPaper : ""}`} aria-label="Book now">
      <div className={styles.wrap}>
        <div className={styles.ctaCard} data-reveal="">
          <div>
            <h2>
              {CTA_BAND.heading} <em>{CTA_BAND.highlight}</em>?
            </h2>
            <p>{CTA_BAND.text}</p>
          </div>
          <div className={styles.actions}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={QUOTATION_HREF}>
              Get a quotation
            </Link>
            <a className={`${styles.btn} ${styles.btnLight}`} href={WHATSAPP_URL} {...EXTERNAL}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A reservation form screenshot with numbered callouts; phones get the narrow version. */
export function FormScreenshot({ wide, narrow, alt }: { wide: Screenshot; narrow: Screenshot; alt: string }) {
  const variant = (shot: Screenshot, className: string) => (
    <div className={`${styles.shotVariant} ${className}`}>
      <Image src={shot.src} alt={alt} width={shot.width} height={shot.height} unoptimized />
      {shot.dots.map(([n, x, y]) => (
        <span key={n} className={styles.dot} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
          {n}
        </span>
      ))}
    </div>
  );
  return (
    <figure className={styles.shot} data-reveal="">
      {variant(wide, styles.shotWide)}
      {variant(narrow, styles.shotNarrow)}
    </figure>
  );
}

/** A policy (luggage, pets) as an expanding section. */
export function PolicyAccordion({ policy }: { policy: Policy }) {
  return (
    <details className={styles.acc} data-reveal="">
      <summary>
        {policy.title} <Icon name="chevron" />
      </summary>
      <div className={styles.accBody}>
        <p>{policy.intro}</p>
        {policy.sections.map((section) => (
          <div key={section.title}>
            <h3>{section.title}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ))}
        {policy.outro && <p>{policy.outro}</p>}
      </div>
    </details>
  );
}
