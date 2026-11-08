import type { Metadata } from "next";
import ComingSoon from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "Contact – Goal International",
};

export default function ContactPage() {
  return <ComingSoon title="Contact" />;
}
