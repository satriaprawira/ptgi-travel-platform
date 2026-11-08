import type { Metadata } from "next";
import ComingSoon from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "About – Goal International",
};

export default function AboutPage() {
  return <ComingSoon title="About" />;
}
