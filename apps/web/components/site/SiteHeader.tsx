"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPANY_NAME, SITE_NAV } from "@/lib/content";
import styles from "./Site.module.css";

/** Whether a menu link points at the current page. Home only matches "/" itself. */
function isCurrent(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Customer site header: the dark logo band, which scrolls away, and the yellow menu bar, which stays at the
 * top. Below 900px the menu folds into a ☰ button. The design's "Log In" is left out until customers have
 * accounts; staff sign in at /login.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const current = SITE_NAV.find((item) => isCurrent(item.href, pathname));

  // While the phone menu is open, Escape or a click outside the menu bar closes it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };
    const onClick = (event: MouseEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <>
      <header className={styles.band}>
        <Link href="/" className={styles.brand}>
          {/* unoptimized: the standalone server has no image optimizer, and the logo is already small. */}
          <Image src="/logo/goal-intl-logo.png" alt="" width={92} height={92} priority unoptimized />
          <span>{COMPANY_NAME}</span>
        </Link>
      </header>

      <nav ref={nav} className={`${styles.nav} ${open ? styles.navOpen : ""}`} aria-label="Main">
        <div className={styles.navInner}>
          <button
            ref={menuButton}
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((wasOpen) => !wasOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Menu
            {current && (
              <>
                {" · "}
                <span className={styles.menuCurrent}>{current.label}</span>
              </>
            )}
          </button>
          <ul id="site-menu" className={styles.menu}>
            {SITE_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
