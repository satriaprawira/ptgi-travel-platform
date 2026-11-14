import Link from "next/link";
import Icon, { type IconName } from "@/components/site/sections/Icon";
import { CtaBand, EXTERNAL, PolicyAccordion, SectionHead } from "@/components/site/sections/Parts";
import styles from "@/components/site/sections/Sections.module.css";
import { loadFareTable, type FareTable as PriceList } from "@/lib/api/fareTable";
import { windowText, yen } from "@/lib/api/format";
import {
  ANNOUNCEMENT,
  FARE_PAGE,
  LUGGAGE_GUIDE,
  PET_POLICY,
  QUOTATION_HREF,
  TERMS,
  WHATSAPP_URL,
  isAnnouncementShowing,
} from "@/lib/content";
import { addOnShortText, chargeLines, priceExample } from "@/lib/priceText";
import { pageMetadata } from "@/lib/seo";

// Rendered per request: prices come from the API (staff edit them in admin), and the announcement shows
// only between its dates.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Fare and Policy – Goal International",
  description:
    "How our airport transfer fares work, extra charges, payment options, and our booking, cancellation, luggage and pet policies.",
  path: "/fare-and-policy",
});

function RateCard({ icon, title, rows }: { icon: IconName; title: string; rows: { label: string; note?: string; values: string[] }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className={`${styles.card} ${styles.rateCard}`}>
      <h3 className={styles.h3}>
        <span className={styles.iconTile}>
          <Icon name={icon} />
        </span>
        {title}
      </h3>
      <dl className={styles.rates}>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>
              {row.label}
              {row.note && <small>{row.note}</small>}
            </dt>
            <dd>
              {row.values.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Charges({ table }: { table: PriceList }) {
  const example = priceExample(table, FARE_PAGE.example);
  return (
    <>
      <SectionHead
        id="charges-title"
        heading={FARE_PAGE.chargesHeading}
        lead={FARE_PAGE.chargesLead}
        className={styles.chargesHead}
      />
      <div className={`${styles.grid} ${styles.g2}`} data-reveal="">
        <RateCard
          icon="car"
          title="Car type"
          rows={table.vehicleCharges.map((charge) => ({ label: charge.name, values: chargeLines(charge) }))}
        />
        <RateCard
          icon="clock"
          title="Time of pickup"
          rows={[
            ...table.timeSurcharges.map((s) => ({
              label: s.label,
              note: windowText(s.startsAt, s.endsAt),
              values: [`+${yen(s.amountJpy)}`],
            })),
            ...table.leadTimeSurcharges.map((s) => ({
              label: s.label,
              note: `Pickup within ${s.withinHours} hours of booking`,
              values: [`+${yen(s.amountJpy)}`],
            })),
          ]}
        />
        <RateCard
          icon="plus"
          title="Extras"
          rows={table.addOns.map((addOn) => ({ label: addOn.label, values: [addOnShortText(addOn)] }))}
        />
        <RateCard
          icon="card"
          title="Payment"
          rows={table.paymentMethods.map((method) => ({
            label: method.label,
            note: method.description ?? undefined,
            values: [method.feeJpy > 0 ? `+${yen(method.feeJpy)}` : "No fee"],
          }))}
        />
      </div>
      <div className={`${styles.grid} ${styles.g2} ${styles.extraRow}`} data-reveal="">
        {example && (
          <div className={`${styles.card} ${styles.example}`}>
            <h3 className={styles.h3}>{FARE_PAGE.example.title}</h3>
            <p className={styles.body}>{FARE_PAGE.example.text}</p>
            <dl className={styles.rates}>
              {example.lines.map((line, index) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>{index === 0 ? yen(line.amountJpy) : `+${yen(line.amountJpy)}`}</dd>
                </div>
              ))}
              <div className={styles.total}>
                <dt>{FARE_PAGE.example.total}</dt>
                <dd>{yen(example.totalJpy)}</dd>
              </div>
            </dl>
          </div>
        )}
        <LateArrival />
      </div>
    </>
  );
}

function LateArrival() {
  return (
    <div className={styles.card}>
      <h3 className={styles.h3}>{FARE_PAGE.lateArrival.title}</h3>
      {FARE_PAGE.lateArrival.paragraphs.map((paragraph) => (
        <p key={paragraph} className={styles.body}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default async function FareAndPolicyPage() {
  const table = await loadFareTable();
  const announcement = isAnnouncementShowing(ANNOUNCEMENT) ? ANNOUNCEMENT : null;

  return (
    <main className={styles.page}>
      <section className={styles.pageHead} aria-labelledby="fare-title">
        <div className={styles.wrap}>
          {/* 1. Announcement */}
          {announcement && (
            <div className={styles.notice} role="note">
              <div className={styles.iconTile}>
                <Icon name="megaphone" />
              </div>
              <div>
                <p className={styles.noticeTitle}>{announcement.title}</p>
                <p>{announcement.text}</p>
              </div>
            </div>
          )}
          <p className={styles.eyebrow}>{FARE_PAGE.eyebrow}</p>
          <h1 className={`${styles.h1} ${styles.pageTitle}`} id="fare-title">
            {FARE_PAGE.title}
          </h1>
          <p className={styles.lead}>{FARE_PAGE.intro}</p>
        </div>
      </section>

      {/* 2. Additional charges (the area fares aren't listed: customers get their price in the form) */}
      <section
        className={`${styles.sec} ${styles.faresSec}`}
        id="charges"
        aria-labelledby={table ? "charges-title" : undefined}
        aria-label={table ? undefined : "Prices"}
      >
        <div className={styles.wrap}>
          {table ? (
            <Charges table={table} />
          ) : (
            <>
              <div className={`${styles.card} ${styles.unavailable}`} role="status">
                <div className={styles.iconTile}>
                  <Icon name="tag" />
                </div>
                <div>
                  <p className={styles.body}>{FARE_PAGE.unavailable}</p>
                  <div className={styles.actions}>
                    <Link className={`${styles.btn} ${styles.btnPrimary}`} href={QUOTATION_HREF}>
                      {FARE_PAGE.exactPrice}
                    </Link>
                    <a className={`${styles.btn} ${styles.btnSecondary}`} href={WHATSAPP_URL} {...EXTERNAL}>
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
              <div className={`${styles.grid} ${styles.g2} ${styles.extraRow}`}>
                <LateArrival />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Policies */}
      <section className={`${styles.sec} ${styles.paper}`} id="policies" aria-labelledby="policy-title">
        <div className={styles.wrap}>
          <SectionHead id="policy-title" eyebrow={FARE_PAGE.policiesEyebrow} heading={FARE_PAGE.policiesHeading} />
          <div className={`${styles.card} ${styles.cancelCard}`} data-reveal="">
            <h3 className={styles.h3}>{FARE_PAGE.cancellation.title}</h3>
            <p className={styles.body}>{FARE_PAGE.cancellation.text}</p>
            <ul className={styles.cancelBar}>
              {FARE_PAGE.cancellation.tiers.map((tier) => (
                <li key={tier.amount}>
                  <b>{tier.amount}</b>
                  <span>{tier.when}</span>
                </li>
              ))}
            </ul>
          </div>
          <details className={styles.acc} open data-reveal="">
            <summary>
              Terms &amp; Conditions <Icon name="chevron" />
            </summary>
            <div className={styles.accBody}>
              <ol>
                {TERMS.map((term) => (
                  <li key={term.title}>
                    <b>{term.title}:</b> {term.text}
                  </li>
                ))}
              </ol>
              <p>{FARE_PAGE.termsAgreement}</p>
            </div>
          </details>
          <PolicyAccordion policy={LUGGAGE_GUIDE} />
          <PolicyAccordion policy={PET_POLICY} />
        </div>
      </section>

      <CtaBand afterPaper />
    </main>
  );
}
