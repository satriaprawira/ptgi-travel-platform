"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdminDashboard.module.css";
import {
  adminUsers,
  bookings,
  drivers,
  highSeasonRows,
  modalForms,
  notificationTemplates,
  pricingRows,
  scheduleAxis,
  surchargeRows,
  todaySchedule,
  vehicles,
  waitlist,
  type BadgeVariant,
  type ModalKind,
} from "@/lib/adminData";

type PanelId =
  | "bookings"
  | "availability"
  | "drivers"
  | "vehicles"
  | "pricing"
  | "surcharge"
  | "highseason"
  | "notifications"
  | "users";

interface NavItem {
  id: PanelId;
  label: string;
  icon: JSX.Element;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        id: "bookings",
        label: "Bookings Queue",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: "availability",
        label: "Availability & Waitlist",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Fleet",
    items: [
      {
        id: "drivers",
        label: "Driver Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5 20c1.2-3.8 4-5.6 7-5.6s5.8 1.8 7 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: "vehicles",
        label: "Vehicle Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 16V11l2-5h12l2 5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7.5" cy="16.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="16.5" cy="16.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Pricing",
    items: [
      {
        id: "pricing",
        label: "Service Pricing",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.3-5 3 2.2 2.6 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "surcharge",
        label: "Surcharge",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 5l14 14M8 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19 17.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        id: "highseason",
        label: "High-Season Rates",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        id: "notifications",
        label: "Notification Templates",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3a5 5 0 015 5v3.5l1.6 3.1a1 1 0 01-.9 1.4H6.3a1 1 0 01-.9-1.4L7 11.5V8a5 5 0 015-5zM9.5 19a2.5 2.5 0 005 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        id: "users",
        label: "User Management",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 20c.9-3.4 3.2-5 6-5s5.1 1.6 6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M16 5.2c1.4.4 2.4 1.7 2.4 3.2 0 1.5-1 2.8-2.4 3.2M18.5 20c-.5-2-1.5-3.5-3-4.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
  },
];

const PANEL_META: Record<PanelId, { title: string; description: string; action?: { label: string; kind: ModalKind } }> = {
  bookings: {
    title: "Bookings Queue",
    description:
      "Every reservation from customer request through confirmation – review, quote, and act from one place.",
  },
  availability: {
    title: "Availability & Waitlist",
    description: "Today's driver and vehicle schedule, plus bookings waiting for a slot to open up.",
  },
  drivers: {
    title: "Driver Management",
    description: "Driver roster, contact details, and current assignment status.",
    action: { label: "+ Add Driver", kind: "driver" },
  },
  vehicles: {
    title: "Vehicle Management",
    description: "Fleet records – type, plate, capacity, and current condition.",
    action: { label: "+ Add Vehicle", kind: "vehicle" },
  },
  pricing: {
    title: "Service Pricing Package",
    description: "Base fare for each car type – edit directly, no developer needed.",
  },
  surcharge: {
    title: "Surcharge",
    description: "Additional fees applied on top of the base fare.",
    action: { label: "+ Add Surcharge Rule", kind: "surcharge" },
  },
  highseason: {
    title: "High-Season Rates",
    description: "Date-range rate adjustments for peak travel periods.",
    action: { label: "+ Add Period", kind: "highseason" },
  },
  notifications: {
    title: "Notification Templates",
    description: "Email and WhatsApp message templates – edit wording without touching code.",
    action: { label: "+ Add Template", kind: "template" },
  },
  users: {
    title: "User Management",
    description: "Internal accounts – admins, travel agent staff, and drivers.",
    action: { label: "+ Add User", kind: "user" },
  },
};

function badgeClass(variant: BadgeVariant) {
  const variantClass = {
    indigo: styles.badgeIndigo,
    accent: styles.badgeAccent,
    success: styles.badgeSuccess,
    muted: styles.badgeMuted,
  }[variant];
  return `${styles.badge} ${variantClass}`;
}

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState<PanelId>("bookings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [editingTemplates, setEditingTemplates] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const templateRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    editingTemplates.forEach((id) => templateRefs.current[id]?.focus());
  }, [editingTemplates]);

  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const selectPanel = (id: PanelId) => {
    setActivePanel(id);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const toggleTemplateEdit = (id: string) => {
    setEditingTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Template saved");
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const saveModal = () => {
    setModalKind(null);
    showToast("Saved – this is a mockup, no data is stored");
  };

  const meta = PANEL_META[activePanel];
  const modalConfig = modalKind ? modalForms[modalKind] : null;

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <circle cx="13" cy="13" r="12" stroke="#fff" strokeWidth="1.4" />
            <path d="M13 4v18M4 13h18" stroke="#fff" strokeWidth="1.4" />
            <path
              d="M13 4c3 2.5 4.6 6 4.6 9s-1.6 6.5-4.6 9c-3-2.5-4.6-6-4.6-9S10 6.5 13 4z"
              stroke="#C9462C"
              strokeWidth="1.4"
            />
          </svg>
          NRT–HND Transfers
          <span className={styles.adminBadge}>Admin</span>
        </div>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className={styles.shellBody}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${activePanel === item.id ? styles.navItemActive : ""}`}
                  onClick={() => selectPanel(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className={styles.content}>
          <section className={styles.panel} key={activePanel}>
            <div className={styles.panelHead}>
              <div>
                <h1>{meta.title}</h1>
                <p>{meta.description}</p>
              </div>
              {meta.action && (
                <button className={styles.btnPrimary} onClick={() => setModalKind(meta.action!.kind)}>
                  {meta.action.label}
                </button>
              )}
            </div>

            {activePanel === "bookings" && (
              <>
                <div className={styles.filters}>
                  <input type="text" placeholder="Search passenger or booking ID…" />
                  <select>
                    <option>All statuses</option>
                    <option>Needs action</option>
                    <option>Waiting list</option>
                    <option>Confirmed</option>
                    <option>Cancelled</option>
                  </select>
                  <select>
                    <option>Today</option>
                    <option>Next 7 days</option>
                    <option>This month</option>
                  </select>
                </div>

                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Passenger</th>
                        <th>Route</th>
                        <th>Pick-up</th>
                        <th>Car type</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className={styles.mono}>{booking.id}</td>
                          <td>
                            {booking.passenger}
                            <span className={styles.cellSub}>{booking.origin}</span>
                          </td>
                          <td>{booking.route}</td>
                          <td>{booking.pickup}</td>
                          <td>{booking.carType}</td>
                          <td>
                            <span className={badgeClass(booking.statusVariant)}>{booking.status}</span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button className={styles.iconBtn} onClick={() => showToast(booking.actionToast)}>
                                {booking.actionLabel}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activePanel === "availability" && (
              <>
                <div className={styles.card}>
                  <h2>Today&apos;s schedule</h2>
                  <div className={styles.cardSub}>06:00 – 22:00 operating window</div>

                  {todaySchedule.map((row) => (
                    <div className={styles.timelineRow} key={row.driver}>
                      <div className={styles.timelineDriver}>
                        {row.driver}
                        <span className={styles.cellSub}>{row.vehicle}</span>
                      </div>
                      <div>
                        <div className={styles.timelineTrack}>
                          {row.blocks.map((block, index) => (
                            <div
                              key={index}
                              className={`${styles.timelineBlock} ${
                                block.variant === "booked" ? styles.timelineBlockBooked : styles.timelineBlockHold
                              }`}
                              style={{ left: block.left, width: block.width }}
                            >
                              {block.label}
                            </div>
                          ))}
                        </div>
                        <div className={styles.timelineAxis}>
                          {scheduleAxis.map((mark) => (
                            <span key={mark}>{mark}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h2>Waitlist queue</h2>
                  <div className={styles.cardSub}>Bookings held back by an availability conflict, ordered by wait time</div>
                  <div className={styles.tableWrap}>
                    <table>
                      <thead>
                        <tr>
                          <th>Pos.</th>
                          <th>Booking</th>
                          <th>Passenger</th>
                          <th>Requested</th>
                          <th>Reason</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlist.map((entry) => (
                          <tr key={entry.bookingId}>
                            <td>
                              <span className={styles.queuePosition}>{entry.position}</span>
                            </td>
                            <td className={styles.mono}>{entry.bookingId}</td>
                            <td>{entry.passenger}</td>
                            <td>{entry.requested}</td>
                            <td>{entry.reason}</td>
                            <td>
                              <div className={styles.rowActions}>
                                <button className={styles.iconBtn} onClick={() => showToast(entry.actionToast)}>
                                  {entry.actionLabel}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activePanel === "drivers" && (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Phone</th>
                      <th>Assigned vehicle</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.name}>
                        <td>{driver.name}</td>
                        <td className={styles.mono}>{driver.phone}</td>
                        <td>{driver.vehicle}</td>
                        <td>
                          <span className={badgeClass(driver.statusVariant)}>{driver.status}</span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.iconBtn} onClick={() => setModalKind("driver")}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activePanel === "vehicles" && (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Plate</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.plate}>
                        <td>{vehicle.name}</td>
                        <td className={styles.mono}>{vehicle.plate}</td>
                        <td>{vehicle.type}</td>
                        <td>{vehicle.capacity}</td>
                        <td>
                          <span className={badgeClass(vehicle.statusVariant)}>{vehicle.status}</span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.iconBtn} onClick={() => setModalKind("vehicle")}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activePanel === "pricing" && (
              <div className={styles.card}>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Notes</th>
                        <th>Base price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRows.map((row) => (
                        <tr key={row.packageName}>
                          <td>{row.packageName}</td>
                          <td className={styles.cellSub} style={{ display: "table-cell" }}>
                            {row.note}
                          </td>
                          <td className={styles.amountInput}>
                            <span>¥</span>
                            <input type="text" defaultValue={row.price} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.saveRow}>
                  <button className={styles.btnPrimary} onClick={() => showToast("Pricing updated")}>
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {activePanel === "surcharge" && (
              <div className={styles.card}>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Amount</th>
                        <th>Active</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {surchargeRows.map((row) => (
                        <tr key={row.rule}>
                          <td>{row.rule}</td>
                          <td className={styles.amountCell}>
                            <span>¥</span>
                            <input type="text" defaultValue={row.amount} />
                          </td>
                          <td>
                            <span className={badgeClass(row.active ? "success" : "muted")}>
                              {row.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button className={styles.iconBtn} onClick={() => setModalKind("surcharge")}>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.saveRow}>
                  <button className={styles.btnPrimary} onClick={() => showToast("Surcharge rules updated")}>
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {activePanel === "highseason" && (
              <div className={styles.card}>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Dates</th>
                        <th>Rate adjustment</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {highSeasonRows.map((row) => (
                        <tr key={row.period}>
                          <td>{row.period}</td>
                          <td>{row.dates}</td>
                          <td>
                            <span className={badgeClass("accent")}>{row.adjustment}</span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button className={styles.iconBtn} onClick={() => setModalKind("highseason")}>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePanel === "notifications" && (
              <>
                {notificationTemplates.map((template) => {
                  const isEditing = editingTemplates.has(template.id);
                  return (
                    <div className={styles.templateCard} key={template.id}>
                      <div className={styles.templateHead}>
                        <h3>{template.name}</h3>
                        <div className={styles.channelTags}>
                          {template.channels.map((channel) => (
                            <span className={styles.channelTag} key={channel}>
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className={styles.templateBody}
                        disabled={!isEditing}
                        defaultValue={template.body}
                        ref={(el) => {
                          templateRefs.current[template.id] = el;
                        }}
                      />
                      <div className={styles.varHint}>{template.hint}</div>
                      <div className={styles.saveRow} style={{ marginTop: 10 }}>
                        <button className={styles.btnSecondary} onClick={() => toggleTemplateEdit(template.id)}>
                          {isEditing ? "Save" : "Edit"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activePanel === "users" && (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last login</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user) => (
                      <tr key={user.email}>
                        <td>{user.name}</td>
                        <td className={styles.mono}>{user.email}</td>
                        <td>
                          <span className={badgeClass(user.roleVariant)}>{user.role}</span>
                        </td>
                        <td>
                          <span className={badgeClass("success")}>{user.status}</span>
                        </td>
                        <td>{user.lastLogin}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.iconBtn} onClick={() => setModalKind("user")}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      <div className={`${styles.modalOverlay} ${modalKind ? styles.modalOverlayShow : ""}`}>
        <div className={styles.modal}>
          <div className={styles.modalHead}>
            <h3>{modalConfig?.title ?? "Add"}</h3>
            <button className={styles.modalClose} onClick={() => setModalKind(null)} aria-label="Close">
              &times;
            </button>
          </div>
          <div>
            {modalConfig?.rows.map((row, rowIndex) => {
              const fields = Array.isArray(row) ? row : [row];
              const content = fields.map((fieldConfig) => (
                <div className={styles.field} key={fieldConfig.label}>
                  <label>{fieldConfig.label}</label>
                  {fieldConfig.type === "select" ? (
                    <select>
                      {fieldConfig.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : fieldConfig.type === "textarea" ? (
                    <textarea placeholder={fieldConfig.placeholder} />
                  ) : (
                    <input type={fieldConfig.type} placeholder={fieldConfig.placeholder} />
                  )}
                </div>
              ));
              return Array.isArray(row) ? (
                <div className={styles.grid2} key={rowIndex}>
                  {content}
                </div>
              ) : (
                content
              );
            })}
          </div>
          <div className={styles.modalFoot}>
            <button className={styles.btnSecondary} onClick={() => setModalKind(null)}>
              Cancel
            </button>
            <button className={styles.btnPrimary} onClick={saveModal}>
              Save
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </div>
  );
}