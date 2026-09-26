import Link from "next/link";

// Placeholder — the real home page will be defined later.
export default function Home() {
  return (
    <main style={{ padding: "96px 32px", textAlign: "center" }}>
      <h1>Goal International Co., Ltd</h1>
      <p>Home page coming soon.</p>
      <div><Link href="/login">Login</Link></div>
      <div><Link href="/reservation-form">Reserve an airport pickup</Link></div>
      <div><Link href="/admin">Admin</Link></div>
    </main>
  );
}
