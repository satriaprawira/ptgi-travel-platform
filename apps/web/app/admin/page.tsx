import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin – Goal International",
  description: "Manage bookings, fleet, pricing, notifications, and users.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}