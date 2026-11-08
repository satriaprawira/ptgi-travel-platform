import type { Metadata } from "next";
import ComingSoon from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "How to Book – Goal International",
};

export default function HowToBookPage() {
  return <ComingSoon title="How to Book" />;
}
