import { essentials, type EssentialId } from "../content";
import { CarouselDots } from "../ui/carousel-dots";
import carousel from "../ui/carousel.module.css";
import { revealDelay } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";
import styles from "./essentials.module.css";
import { Spotlight } from "./spotlight";
import { visuals } from "./visuals";

/** Where each card sits in the bento on wide screens. */
const placement: Partial<Record<EssentialId, string>> = {
  notifications: "lg:row-span-2",
  bookings: "sm:col-span-2",
  tests: "sm:col-span-2 lg:col-span-1",
};

export function EssentialsSection() {
  return (
    <section id="essentials" className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-15 max-sm:py-5 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Everything around the consult"
        title="The small things that give you back your day."
        lede="Beyond the consult itself, the console takes care of the details that usually eat into your time."
      />

      {/* A swipeable row on phones (carousel.module.css), with dots under it. */}
      <Spotlight className={`${carousel.track} mt-14 grid gap-4 max-sm:mt-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5`}>
        {essentials.map(({ id, title, text }, index) => {
          const Visual = visuals[id];
          return (
            <article
              key={id}
              data-spot
              data-reveal="scale"
              style={revealDelay((index % 3) * 110)}
              className={`${styles.card} glass-panel flex flex-col overflow-hidden rounded-3xl p-5 sm:p-6 ${placement[id] ?? ""}`}
            >
              <div className={`relative grid ${id === "notifications" ? "min-h-56 flex-1" : "min-h-40"}`}>
                <Visual />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] max-lg:text-center">{title}</h3>
              <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-body max-lg:text-center">{text}</p>
            </article>
          );
        })}
      </Spotlight>
      <CarouselDots count={essentials.length} label="Features" />
    </section>
  );
}
