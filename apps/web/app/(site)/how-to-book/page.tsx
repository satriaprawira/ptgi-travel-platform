import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/site/sections/Icon";
import { CtaBand, EXTERNAL, FormScreenshot, SectionHead } from "@/components/site/sections/Parts";
import styles from "@/components/site/sections/Sections.module.css";
import { AFTER_BOOKING, BOOKING_DONE, BOOKING_STEPS, HOW_TO_BOOK, QUOTATION_HREF, TICKET_TIP, WHATSAPP_URL } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How to Book – Goal International",
  description:
    "Book your airport pickup in five steps with our reservation form. You see an estimated price as you go and pay nothing until we confirm.",
  path: "/how-to-book",
});

export default function HowToBookPage() {
  return (
    <main className={styles.page}>
      <section className={styles.pageHead} aria-labelledby="htb-title">
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>{HOW_TO_BOOK.eyebrow}</p>
          <h1 className={`${styles.h1} ${styles.pageTitle}`} id="htb-title">
            {HOW_TO_BOOK.title}
          </h1>
          <p className={styles.lead}>{HOW_TO_BOOK.intro}</p>
          <div className={styles.actions}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={QUOTATION_HREF}>
              {HOW_TO_BOOK.start} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.sec} ${styles.stepsList}`} aria-label="Reservation steps">
        <div className={styles.wrap}>
          {BOOKING_STEPS.map((step, index) => (
            <article key={step.title} className={styles.step}>
              <div className={styles.stepText} data-reveal="">
                <span className={styles.stepNum}>{String(index + 1).padStart(2, "0")}</span>
                <h2 className={styles.h2}>{step.title}</h2>
                <p className={styles.body}>{step.text}</p>
                <ol className={styles.callouts}>
                  {step.callouts.map((callout) => (
                    <li key={callout}>{callout}</li>
                  ))}
                </ol>
                {step.ticketTip && (
                  <div className={styles.tip}>
                    <Image
                      src={TICKET_TIP.image.src}
                      alt={TICKET_TIP.image.alt}
                      width={TICKET_TIP.image.width}
                      height={TICKET_TIP.image.height}
                      unoptimized
                    />
                    <p>
                      <b>{TICKET_TIP.title}</b> {TICKET_TIP.text}
                    </p>
                  </div>
                )}
              </div>
              <FormScreenshot wide={step.wide} narrow={step.narrow} alt={step.alt} />
            </article>
          ))}
          <article className={styles.step}>
            <div className={styles.stepText} data-reveal="">
              <span className={styles.stepNum}>✓</span>
              <h2 className={styles.h2}>{BOOKING_DONE.title}</h2>
              <p className={styles.body}>{BOOKING_DONE.text}</p>
            </div>
            <FormScreenshot wide={BOOKING_DONE.wide} narrow={BOOKING_DONE.narrow} alt={BOOKING_DONE.alt} />
          </article>
        </div>
      </section>

      <section className={`${styles.sec} ${styles.paper}`} aria-labelledby="next-title">
        <div className={styles.wrap}>
          <SectionHead id="next-title" eyebrow={AFTER_BOOKING.eyebrow} heading={AFTER_BOOKING.heading} />
          <div className={`${styles.grid} ${styles.g3}`} data-reveal="">
            {AFTER_BOOKING.cards.map((card) => (
              <div key={card.title} className={`${styles.card} ${styles.nextCard}`}>
                <div className={styles.iconTile}>
                  <Icon name={card.icon} />
                </div>
                <h3 className={styles.h3}>{card.title}</h3>
                <p className={styles.body}>{card.text}</p>
              </div>
            ))}
          </div>
          <div className={`${styles.card} ${styles.helpRow}`} data-reveal="">
            <div>
              <h3 className={styles.h3}>{AFTER_BOOKING.chatHeading}</h3>
              <p className={styles.body}>{AFTER_BOOKING.chatText}</p>
            </div>
            <a className={`${styles.btn} ${styles.btnSecondary}`} href={WHATSAPP_URL} {...EXTERNAL}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <CtaBand afterPaper />
    </main>
  );
}
