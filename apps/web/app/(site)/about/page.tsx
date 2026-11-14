import Image from "next/image";
import Icon from "@/components/site/sections/Icon";
import { CtaBand, SectionHead } from "@/components/site/sections/Parts";
import styles from "@/components/site/sections/Sections.module.css";
import { loadFareTable, type FareTable } from "@/lib/api/fareTable";
import { ABOUT_PAGE, FLEET, FLEET_SECTION, OFFICES, TEAM, TEAM_SECTION, VALUES, type Office } from "@/lib/content";
import { chargeLines } from "@/lib/priceText";
import { pageMetadata } from "@/lib/seo";

// Rendered per request: each car's extra cost, seats and suitcases come from the API.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "About – Goal International",
  description:
    "A Tokyo transport company in Ota City, established in 2001: our offices, our fleet from Standard cars to the Toyota Alphard and HiAce Grand Cabin, and our team.",
  path: "/about",
});

/** Keeps numbers like "245-249" on one line instead of breaking at a hyphen (as in the footer). */
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

function OfficeAddress({ office }: { office: Office }) {
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

/**
 * Every car in FLEET always shows. Its extra cost and the most seats and suitcases among its cars are added
 * once the fleet has an Available car of that class; until then (or without the API) the card shows without them.
 */
function fleetCards(table: FareTable | null) {
  return FLEET.map((car) => {
    const charge = table?.vehicleCharges.find((c) => c.classCode === car.classCode);
    const capacity = table?.vehicleClasses.find((c) => c.code === car.classCode) ?? null;
    const prices = charge ? chargeLines(charge).map((line) => (line === "Included" ? "Included in the fare" : line)) : [];
    return { car, prices, capacity };
  });
}

export default async function AboutPage() {
  const table = await loadFareTable();
  const offices: Office[] = [OFFICES.head, OFFICES.narita, OFFICES.osaka, OFFICES.indonesia];

  return (
    <main className={styles.page}>
      {/* 1. About us */}
      <section className={styles.pageHead} aria-labelledby="about-title">
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>{ABOUT_PAGE.eyebrow}</p>
          <h1 className={`${styles.h1} ${styles.pageTitle}`} id="about-title">
            {ABOUT_PAGE.title}
          </h1>
          <p className={styles.lead}>{ABOUT_PAGE.intro}</p>
          <dl className={`${styles.facts} ${styles.factsTwo}`}>
            {ABOUT_PAGE.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={styles.sec} style={{ paddingTop: 40 }} aria-labelledby="offices-title">
        <div className={styles.wrap}>
          <div className={`${styles.grid} ${styles.g3} ${styles.values}`} data-reveal="">
            {VALUES.map((value) => (
              <div key={value.title} className={styles.card}>
                <div className={styles.iconTile}>
                  <Icon name={value.icon} />
                </div>
                <h2 className={styles.h3}>{value.title}</h2>
                <p className={styles.body}>{value.text}</p>
              </div>
            ))}
          </div>
          <h2 className={`${styles.h2} ${styles.officesHead}`} id="offices-title" data-reveal="">
            {ABOUT_PAGE.officesHeading}
          </h2>
          <div className={`${styles.grid} ${styles.g4}`} data-reveal="">
            {offices.map((office) => (
              <div key={office.name} className={`${styles.card} ${styles.officeCard}`}>
                <h3>{office.name}</h3>
                {office.company && <p className={styles.company}>{office.company}</p>}
                <p>
                  <OfficeAddress office={office} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Our fleet */}
      <section className={`${styles.sec} ${styles.paper}`} id="fleet" aria-labelledby="fleet-title">
        <div className={styles.wrap}>
          <SectionHead id="fleet-title" eyebrow={FLEET_SECTION.eyebrow} heading={FLEET_SECTION.heading} lead={FLEET_SECTION.lead} />
          <div className={`${styles.grid} ${styles.g3}`}>
            {fleetCards(table).map(({ car, prices, capacity }) => (
              <article key={car.classCode} className={`${styles.card} ${styles.lift} ${styles.fleetCard}`} data-reveal="">
                <div className={styles.photo}>
                  <Image
                    src={car.photo.src}
                    alt={car.photo.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 380px"
                    style={car.photo.position ? { objectPosition: car.photo.position } : undefined}
                    unoptimized
                  />
                </div>
                <div className={styles.fleetBody}>
                  <h3 className={styles.h3}>{car.name}</h3>
                  <span className={styles.fleetModels}>{car.models}</span>
                  {car.text && <p className={styles.body}>{car.text}</p>}
                  {(capacity || prices.length > 0) && (
                    <div className={styles.fleetFoot}>
                      {capacity && (
                        <div className={styles.cap}>
                          <span>
                            <Icon name="seat" />
                            {capacity.maxPassengers} seats
                          </span>
                          <span>
                            <Icon name="bag" />
                            {capacity.maxSuitcases} suitcases
                          </span>
                        </div>
                      )}
                      {prices.length > 0 && (
                        <div className={styles.prices}>
                          {prices.map((line) => (
                            <span key={line} className={`${styles.chip} ${styles.chipAccent}`}>
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Our team (only once there is someone to show) */}
      {TEAM.length > 0 && (
        <section className={styles.sec} aria-labelledby="team-title">
          <div className={styles.wrap}>
            <SectionHead id="team-title" eyebrow={TEAM_SECTION.eyebrow} heading={TEAM_SECTION.heading} center />
            <div className={`${styles.grid} ${styles.g4}`} data-reveal="">
              {TEAM.map((person) => (
                <div key={person.name} className={`${styles.card} ${styles.teamCard}`}>
                  <Image
                    src={person.photo.src}
                    alt={person.photo.alt}
                    width={person.photo.width}
                    height={person.photo.height}
                    style={person.photo.position ? { objectPosition: person.photo.position } : undefined}
                    unoptimized
                  />
                  <b>{person.name}</b>
                  <span>{person.role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand afterPaper={TEAM.length === 0} />
    </main>
  );
}
