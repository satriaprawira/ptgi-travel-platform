import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/site/sections/Icon";
import { ArrowLink, CtaBand, EXTERNAL, SectionHead } from "@/components/site/sections/Parts";
import styles from "@/components/site/sections/Sections.module.css";
import {
  COMPANY_NAME,
  CONTACT,
  CUSTOMERS,
  ESTABLISHED,
  GOOGLE_REVIEWS_URL,
  HERO_TICKET,
  HOME,
  HOME_ABOUT,
  HOME_SERVICES,
  PARTNER,
  PAYMENT,
  QUOTATION_HREF,
  SITE_URL,
  SOCIAL_LINKS,
  TESTIMONIALS,
  TESTIMONIALS_SECTION,
  WHATSAPP_URL,
  homeStats,
  yearsInBusiness,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

// Built ahead and refreshed once a day, so "years of excellent services" moves on by itself.
export const revalidate = 86400;

const DESCRIPTION =
  "Private airport pick-up and transfers between Haneda or Narita and Tokyo, Kawasaki and Yokohama. Low-cost hire taxi, hourly car rental with a driver, and tours. Est. 2001.";

export const metadata = pageMetadata({
  title: "Goal International – Airport Pick-up and Transfers, Haneda & Narita",
  description: DESCRIPTION,
  path: "/",
});

/** Structured data for search engines: the company as a local business. */
function businessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: COMPANY_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo/goal-intl-logo.png`,
    image: `${SITE_URL}${HOME.photo.src}`,
    description: DESCRIPTION,
    foundingDate: ESTABLISHED.iso,
    email: CONTACT.emails[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kugahara 3-13-4",
      addressLocality: "Ota City",
      addressRegion: "Tokyo",
      addressCountry: "JP",
    },
    areaServed: ["Tokyo", "Kawasaki", "Yokohama", "Haneda Airport", "Narita Airport"],
    sameAs: SOCIAL_LINKS.filter((link) => link.name !== "WhatsApp").map((link) => link.href),
  };
}

/** "Ms. Li Jun Tan" → "LT", "Mr. Kudratzoda" → "K". */
function initials(name: string) {
  const words = name.replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  return (words.length > 1 ? first + words[words.length - 1][0] : first).toUpperCase();
}

export default function HomePage() {
  const stats = homeStats(yearsInBusiness());
  const lastIsPaper = CUSTOMERS.length === 0 && TESTIMONIALS.length === 0;

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd()).replace(/</g, "\\u003c") }}
      />

      {/* 1. Business introduction */}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>{HOME.eyebrow}</p>
            <h1 className={`${styles.h1} ${styles.heroTitle}`} id="home-title">
              {HOME.title} <span className={styles.heroTitleSub}>{HOME.titleSub}</span>
            </h1>
            <p className={`${styles.lead} ${styles.heroLead}`}>
              {HOME.intro} {PARTNER.name} (
              <a href={PARTNER.url} {...EXTERNAL}>
                {PARTNER.site}
              </a>
              )
              <br />
              <span className={styles.est}>{HOME.est}</span>
            </p>
            <div className={styles.actions}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href={QUOTATION_HREF}>
                Get a quotation <Icon name="arrow" />
              </Link>
              <a className={`${styles.btn} ${styles.btnSecondary}`} href={WHATSAPP_URL} {...EXTERNAL}>
                Chat on WhatsApp
              </a>
            </div>
            <ul className={styles.heroNote}>
              {HOME.points.map((point) => (
                <li key={point}>
                  <Icon name="check" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.heroVisual}>
            <div className={`${styles.photo} ${styles.heroPhoto}`}>
              <Image src={HOME.photo.src} alt={HOME.photo.alt} fill sizes="420px" priority unoptimized />
            </div>
            <div className={styles.heroTicket}>
              <Image
                src={HERO_TICKET.src}
                alt={HERO_TICKET.alt}
                width={HERO_TICKET.width}
                height={HERO_TICKET.height}
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stats} aria-label="Goal International in numbers">
        <dl className={`${styles.wrap} ${styles.statsGrid}`}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 2. Services */}
      <section className={styles.sec} aria-labelledby="home-services">
        <div className={styles.wrap}>
          <SectionHead
            id="home-services"
            eyebrow={HOME_SERVICES.eyebrow}
            heading={HOME_SERVICES.heading}
            lead={HOME_SERVICES.lead}
            aside={
              <Link className={`${styles.btn} ${styles.btnSecondary}`} href="/services">
                All services
              </Link>
            }
          />
          <div className={`${styles.grid} ${styles.g4}`} data-reveal="">
            {HOME_SERVICES.cards.map((card) => (
              <article key={card.title} className={`${styles.card} ${styles.lift} ${styles.svcCard}`}>
                <div className={styles.iconTile}>
                  <Icon name={card.icon} />
                </div>
                <h3 className={styles.h3}>{card.title}</h3>
                <p className={styles.body}>{card.text}</p>
                <ArrowLink href={card.href} external={"external" in card && card.external}>
                  Learn more
                </ArrowLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About us, and how to pay */}
      <section className={`${styles.sec} ${styles.paper}`} aria-labelledby="home-about">
        <div className={`${styles.wrap} ${styles.aboutTeaser}`}>
          <div data-reveal="">
            <p className={styles.eyebrow}>{HOME_ABOUT.eyebrow}</p>
            <h2 className={styles.h2} id="home-about">
              {HOME_ABOUT.heading}
            </h2>
            <p className={styles.body}>{HOME_ABOUT.text}</p>
            <div className={styles.actions}>
              <Link className={`${styles.btn} ${styles.btnSecondary}`} href="/about">
                More about us
              </Link>
            </div>
          </div>
          <div data-reveal="">
            <p className={styles.payLabel} id="home-payment">
              {PAYMENT.label}
            </p>
            <ul className={styles.payGrid} aria-labelledby="home-payment">
              {PAYMENT.logos.map((logo) => (
                <li key={logo.name} className={`${styles.card} ${styles.payTile}`}>
                  {logo.src ? (
                    <Image src={logo.src} alt={logo.name} width={logo.width} height={logo.height} data-logo={logo.name} unoptimized />
                  ) : (
                    <span className={styles.payWord}>{logo.name}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className={`${styles.card} ${styles.payNote}`}>
              <div className={styles.iconTile}>
                <Icon name="cash" />
              </div>
              <div>
                <b>{PAYMENT.cash}</b>
                <span>{PAYMENT.note}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our customers (only once there are some) */}
      {CUSTOMERS.length > 0 && (
        <section className={styles.sec} aria-labelledby="home-customers">
          <div className={styles.wrap}>
            <SectionHead id="home-customers" eyebrow="Our customers" heading="Who we drive for" center />
            <ul className={styles.logoStrip} data-reveal="">
              {CUSTOMERS.map((customer) => (
                <li key={customer.name} className={styles.card}>
                  <Image src={customer.logo.src} alt={customer.name} width={customer.logo.width} height={customer.logo.height} unoptimized />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 5. Testimonials (only once there are some) */}
      {TESTIMONIALS.length > 0 && (
        <section className={styles.sec} style={CUSTOMERS.length > 0 ? { paddingTop: 0 } : undefined} aria-labelledby="home-reviews">
          <div className={styles.wrap}>
            <SectionHead id="home-reviews" eyebrow={TESTIMONIALS_SECTION.eyebrow} heading={TESTIMONIALS_SECTION.heading} center />
            <div className={styles.reviews} data-reveal="">
              {TESTIMONIALS.map((review) => (
                <figure key={review.name} className={`${styles.card} ${styles.review}`}>
                  <div className={styles.quoteMark} aria-hidden="true">
                    “
                  </div>
                  <blockquote>
                    <p>{review.quote}</p>
                  </blockquote>
                  <figcaption>
                    <div className={styles.avatar} aria-hidden="true">
                      {initials(review.name)}
                    </div>
                    <div>
                      <b>{review.name}</b>
                      <span>{review.trip ? `${review.country} · ${review.trip}` : review.country}</span>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className={styles.reviewsFoot}>
              <ArrowLink href={GOOGLE_REVIEWS_URL} external>
                {TESTIMONIALS_SECTION.more}
              </ArrowLink>
            </div>
          </div>
        </section>
      )}

      <CtaBand afterPaper={lastIsPaper} />
    </main>
  );
}
