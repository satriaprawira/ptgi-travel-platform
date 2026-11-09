"use client";

import { useState } from "react";
import type { FareTableAirport } from "@/lib/api/fareTable";
import { yen } from "@/lib/api/format";
import styles from "./Sections.module.css";

/** Base fares for one airport at a time, grouped by price, with a Haneda / Narita switch. */
export default function FareTable({
  airports,
  heading,
  lead,
  quotedByStaff,
}: {
  airports: FareTableAirport[];
  heading: string;
  lead: string;
  quotedByStaff: string;
}) {
  const [code, setCode] = useState(airports[0]?.code);
  const airport = airports.find((a) => a.code === code) ?? airports[0];
  if (!airport) return null;

  return (
    <>
      <div className={`${styles.secHead} ${styles.split} ${styles.faresHead}`} data-reveal="">
        <div>
          <h2 className={styles.h2} id="base-fares">
            {heading}
          </h2>
          <p className={styles.body}>{lead}</p>
        </div>
        {airports.length > 1 && (
          <div className={styles.seg} role="group" aria-label="Airport">
            {airports.map((a) => (
              <button key={a.code} type="button" aria-pressed={a.code === airport.code} onClick={() => setCode(a.code)}>
                {a.name.replace(/\s*Airport$/i, "")}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`${styles.card} ${styles.fareCard}`} aria-live="polite" data-reveal="">
        {airport.fareGroups.map((group) => (
          <div key={`${group.priceJpy}-${group.minPriceJpy}`} className={styles.fareRow}>
            <div className={styles.farePrice}>
              {group.priceJpy !== null ? (
                yen(group.priceJpy)
              ) : (
                <>
                  From {yen(group.minPriceJpy ?? 0)}
                  <small>{quotedByStaff}</small>
                </>
              )}
            </div>
            <ul className={styles.areas} aria-label={`Areas from ${airport.name}`}>
              {group.regions.map((region) => (
                <li key={region.code}>{region.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
