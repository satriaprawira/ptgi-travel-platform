import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/content";
import styles from "./Site.module.css";

/** Stand-in for a menu page whose content hasn't been written yet. */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className={styles.comingSoon}>
      <span className={styles.comingSoonTag}>Coming soon</span>
      <h1>{title}</h1>
      <p>
        We&apos;re still writing this page. In the meantime, you can{" "}
        <Link href="/reservation-form">request a quotation</Link> or{" "}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          chat with us on WhatsApp
        </a>
        .
      </p>
    </main>
  );
}
