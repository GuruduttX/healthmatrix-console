import { SectionHeading } from "../ui/section-heading";
import { FeatureTourLazy } from "./feature-tour-lazy";

export function TourSection() {
  return (
    <section id="tour" className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-15 max-sm:py-5 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="A day in the console"
        title={
          <>
            From the first booking
            <br className="hidden sm:block" /> to the signed prescription.
          </>
        }
        lede="Six moments in a consulting day, each one already in the console. Scroll through them."
      />
      <FeatureTourLazy />
    </section>
  );
}
