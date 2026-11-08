import type { Metadata } from "next";
import ComingSoon from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "Services – Goal International",
};

export default function ServicesPage() {
  return <ComingSoon title="Services" />;
}
