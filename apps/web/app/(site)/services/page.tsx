import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/site/sections/Icon";
import { ArrowLink, CheckList, CtaBand, SectionHead } from "@/components/site/sections/Parts";
import styles from "@/components/site/sections/Sections.module.css";
import { loadFareTable } from "@/lib/api/fareTable";
import { EXTRAS_SECTION, SERVICES, SERVICES_PAGE } from "@/lib/content";
import { addOnText, fromPricesText } from "@/lib/priceText";
import { pageMetadata } from "@/lib/seo";

// Rendered per request: the "from" prices and the extras come from the API (staff can change them).
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Services – Goal International",
  description:
    "Airport pickup and drop-off at Haneda and Narita, hourly car rental with a driver, and vans and buses for groups and big luggage.",
  path: "/services",
});

export default async function ServicesPage() {
  const table = await loadFareTable();
  const fromPrices = table ? fromPricesText(table) : null;

  return (
    <main className={styles.page}>
      <section className={styles.pageHead} aria-labelledby="services-title">
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>{SERVICES_PAGE.eyebrow}</p>
          <h1 className={`${styles.h1} ${styles.pageTitle}`} id="services-title">
            {SERVICES_PAGE.title}
          </h1>
          <dl className={styles.facts}>
            {SERVICES_PAGE.credentials.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd lang={"lang" in item ? item.lang : undefined}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`${styles.sec} ${styles.svcList}`} aria-label="Our services">
        <div className={styles.wrap}>
          {SERVICES.map((service) => (
            <article key={service.id} id={service.id} className={styles.svcBlock}>
              <div className={styles.photo} data-reveal="">
                <Image
                  src={service.photo.src}
                  alt={service.photo.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 460px"
                  style={"position" in service.photo ? { objectPosition: service.photo.position } : undefined}
                  unoptimized
                />
              </div>
              <div data-reveal="">
                <div className={styles.iconTile}>
                  <Icon name={service.icon} />
                </div>
                <h2 className={styles.h2}>{service.title}</h2>
                <p className={styles.body}>{service.text}</p>
                <CheckList items={service.points} />
                <div className={styles.svcMeta}>
                  {"showFromPrices" in service && fromPrices && (
                    <span className={`${styles.chip} ${styles.chipAccent}`}>{fromPrices}</span>
                  )}
                  {"chip" in service && <span className={styles.chip}>{service.chip}</span>}
                  <ArrowLink href={service.link.href}>{service.link.label}</ArrowLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.sec} ${styles.paper}`} aria-labelledby="extras-title">
        <div className={styles.wrap}>
          <SectionHead id="extras-title" eyebrow={EXTRAS_SECTION.eyebrow} heading={EXTRAS_SECTION.heading} lead={EXTRAS_SECTION.lead} />
          {table && table.addOns.length > 0 && (
            <ul className={styles.extras} data-reveal="">
              {table.addOns.map((addOn) => (
                <li key={addOn.id} className={`${styles.card} ${styles.extra}`}>
                  <b>{addOn.label}</b>
                  <span>{addOnText(addOn)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className={`${styles.muted} ${styles.petNote}`}>
            {EXTRAS_SECTION.petBefore} <Link href="/fare-and-policy#policies">{EXTRAS_SECTION.petLink}</Link>{" "}
            {EXTRAS_SECTION.petAfter}
          </p>
        </div>
      </section>

      <CtaBand afterPaper />
    </main>
  );
}
