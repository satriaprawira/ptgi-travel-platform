import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in – Goal International",
  description: "Log in or create an account to manage your airport pickup reservations.",
};

export default function LoginPage() {
  return <LoginForm />;
}
