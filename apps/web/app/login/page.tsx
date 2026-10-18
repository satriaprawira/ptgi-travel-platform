import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Staff sign-in – Goal International",
  description: "Sign-in for Goal International staff: bookings, fleet and pricing.",
};

export default function LoginPage() {
  return <LoginForm />;
}
