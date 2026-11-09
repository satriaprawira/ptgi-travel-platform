"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fades in elements marked data-reveal="" as they scroll into view (the form's "rise" motion), once.
 * Content is visible without JavaScript; only elements still below the screen when the page opens are
 * hidden first, so nothing flashes. Off when the visitor prefers reduced motion.
 */
export default function RevealOnScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const fold = window.innerHeight * 0.92;
    document.querySelectorAll<HTMLElement>('[data-reveal=""]').forEach((element) => {
      if (element.getBoundingClientRect().top < fold) return; // already on screen: leave it as it is
      element.setAttribute("data-reveal", "pending");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll('[data-reveal="pending"]').forEach((element) => element.setAttribute("data-reveal", ""));
    };
  }, [pathname]);

  return null;
}
