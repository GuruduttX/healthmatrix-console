import { Poppins } from "next/font/google";

import { FinalCta } from "./closing/final-cta";
import { MobileJoinBar } from "./closing/mobile-join-bar";
import { SiteFooter } from "./closing/site-footer";
import { ConsentSection } from "./consent/consent-section";
import { EssentialsSection } from "./essentials/essentials-section";
import { FaqSection } from "./faq/faq-section";
import { SiteHeader } from "./header/site-header";
import { Hero } from "./hero/hero";
import { FeatureMarquee } from "./marquee/feature-marquee";
import { JoinSection } from "./onboarding/join-section";
import { TourSection } from "./tour/tour-section";
import { RevealObserver } from "./ui/reveal-observer";
import styles from "./landing.module.css";

/** The welcome page's one typeface, for titles and text alike; the console keeps Figtree and Bricolage. */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * The welcome page for doctors who aren't signed in (`/`, rewritten to `/welcome` by the proxy).
 * A Server Component: the sections render on the server and only the moving parts hydrate (the
 * header, the hero's live cards, the tour, a few counters), each its own small client island.
 * The order walks a doctor from what the console is, through what it does and how consent
 * works, to the four steps of joining.
 */
export function LandingPage() {
  return (
    <div data-landing className={`${poppins.variable} ${styles.root}`}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <div aria-hidden className={styles.aurora}>
        <span />
        <span />
        <span />
        <span />
      </div>

      <SiteHeader />
      <main id="main">
        <Hero />
        <FeatureMarquee />
        <TourSection />
        <EssentialsSection />
        <ConsentSection />
        <JoinSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />

      <MobileJoinBar />
      <RevealObserver />
    </div>
  );
}
