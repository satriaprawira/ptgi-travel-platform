import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import RevealOnScroll from "@/components/site/sections/RevealOnScroll";
import WhatsAppButton from "@/components/WhatsAppButton";

/**
 * Customer pages: the site header and footer, and the floating WhatsApp button. Staff pages (/admin,
 * /login) sit outside this group and keep their own layout.
 */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <WhatsAppButton />
      <RevealOnScroll />
    </>
  );
}
