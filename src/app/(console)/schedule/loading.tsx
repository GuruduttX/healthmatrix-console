import { Bone, ConsultRowBone, HeroBone, SectionBone, SkeletonCard, SkeletonPage, TitleBone } from "@/components/skeletons";

/** A card's title with the round glass chevron that folds it, as `SectionHeader` draws them. */
function FoldingTitleBone({ width }: { width: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <TitleBone width={width} />
      <Bone tone="frost" className="-my-1 size-10 rounded-full lg:size-8.5" />
    </div>
  );
}

/** A label over a field, `field`'s height and corners. */
function FieldBone({ label = "w-24" }: { label?: string }) {
  return (
    <div>
      <Bone className={`h-3 ${label}`} />
      <Bone className="mt-2 h-12 w-full rounded-[1rem] lg:h-10 lg:rounded-lg" />
    </div>
  );
}

/** A time box, as `ClockField` draws it. */
function ClockBone() {
  return <Bone className="h-11 w-29 rounded-[1rem] lg:h-9 lg:rounded-lg" />;
}

/** An on/off switch with its label and hint, as the bookings switch and `SwitchList` draw them. */
function SwitchRowBone({ title = "w-36" }: { title?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <Bone className={`h-4 max-w-full ${title}`} />
        <Bone className="mt-2 h-3 w-52 max-w-full" />
      </div>
      <Bone className="h-7 w-12 shrink-0 rounded-full" />
    </div>
  );
}

/**
 * Schedule: booking requests and the consults by day on one side; on the other, the hours members
 * can book, time off, and the ways to reach the doctor that are coming.
 */
export default function ScheduleLoading() {
  return (
    <SkeletonPage>
      <HeroBone title="Schedule" lines={1} refresh />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
          {/* Booking requests: a line under the title, then the card, most often empty. */}
          <SectionBone width="w-40">
            <div className="-mt-1.5 mb-3 flex h-5 items-center px-0.5">
              <Bone className="h-3.5 w-4/5 max-w-sm" />
            </div>
            <SkeletonCard flush>
              <div className="flex flex-col items-center px-6 py-10">
                <Bone className="mb-4 size-19 rounded-full" />
                <Bone className="h-4.5 w-40" />
                <Bone className="mt-2.5 h-3.5 w-72 max-w-full" />
                <Bone className="mt-2 h-3.5 w-48 max-w-full" />
              </div>
            </SkeletonCard>
          </SectionBone>

          {[2, 1].map((rows, i) => (
            <SectionBone key={i} width={i ? "w-24" : "w-16"}>
              <SkeletonCard flush>
                <div className="divide-y divide-line">
                  {Array.from({ length: rows }, (_, j) => (
                    <ConsultRowBone key={j} />
                  ))}
                </div>
              </SkeletonCard>
            </SectionBone>
          ))}
        </div>

        <SectionBone width="w-28">
          <div className="flex flex-col gap-5">
            {/* Availability: the bookings switch, the weekday tabs, a day's hours, the rules and Save. */}
            <SkeletonCard>
              <FoldingTitleBone width="w-24" />
              <Bone className="mt-3 h-3.5 w-4/5" />

              <div className="glass-flat mt-4 rounded-2xl px-4 py-3.5">
                <SwitchRowBone />
              </div>

              <Bone className="mt-5 h-11.5 w-full rounded-full lg:h-10.5" />

              <div className="glass-flat mt-3 rounded-2xl p-3.5 sm:p-4">
                <Bone className="h-3 w-40" />
                <div className="mt-3 flex items-center gap-1.5">
                  <ClockBone />
                  <Bone className="h-0.5 w-2" />
                  <ClockBone />
                </div>
                <Bone className="mt-3 h-10 w-60 max-w-full rounded-full lg:h-8.5" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <FieldBone />
                <FieldBone label="w-32" />
              </div>
              <Bone className="mt-2.5 h-3 w-4/5" />
              <Bone tone="brand" className="mt-5 h-12 w-36 rounded-full lg:h-10" />
            </SkeletonCard>

            {/* Time off: the quick button, then the form on its own pane, then what's coming up. */}
            <SkeletonCard>
              <FoldingTitleBone width="w-20" />
              <Bone className="mt-3 h-3.5 w-3/4" />
              <Bone tone="frost" className="mt-3 h-12 w-full rounded-full lg:h-10" />

              <div className="glass-flat mt-3 flex flex-col gap-3.5 rounded-2xl p-3.5 sm:p-4">
                <Bone className="h-12.5 w-full rounded-full lg:h-11" />
                <div className="grid grid-cols-2 gap-3">
                  <FieldBone label="w-10" />
                  <FieldBone label="w-20" />
                </div>
                <FieldBone label="w-40" />
                <Bone className="-mt-1.5 h-3 w-40" />
                <Bone tone="brand" className="h-12 w-full rounded-full sm:w-36 lg:h-10" />
              </div>

              <Bone className="mt-4 h-3.5 w-40" />
            </SkeletonCard>

            {/* Other ways to reach you: two switches. */}
            <SkeletonCard>
              <TitleBone width="w-44" />
              <Bone className="mt-2.5 h-3.5 w-4/5" />
              <div className="divide-y divide-line">
                {["w-52", "w-36"].map((title) => (
                  <div key={title} className="py-3.5">
                    <SwitchRowBone title={title} />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>
        </SectionBone>
      </div>
    </SkeletonPage>
  );
}
