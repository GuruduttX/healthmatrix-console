import { Bone, ConsultRowBone, HeroBone, SectionBone, SkeletonCard, SkeletonPage, TitleBone } from "@/components/skeletons";

/** Schedule: consults by day on one side, availability and time off on the other. */
export default function ScheduleLoading() {
  return (
    <SkeletonPage>
      <HeroBone title="Schedule" lines={1} />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
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
          <SkeletonCard>
            <div className="flex items-center justify-between">
              <TitleBone width="w-24" />
              <Bone className="size-6" />
            </div>
            <Bone className="mt-3 h-3.5 w-4/5" />

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4">
              <div className="flex-1">
                <Bone className="h-4 w-36" />
                <Bone className="mt-2 h-3 w-52 max-w-full" />
              </div>
              <Bone className="h-7 w-12 rounded-full" />
            </div>

            <Bone className="mt-5 h-12 w-full rounded-full lg:h-10" />

            <div className="mt-3 rounded-2xl bg-surface p-4">
              <Bone className="h-3 w-40" />
              <div className="mt-3 flex items-center gap-1.5">
                <Bone className="h-11 w-24 rounded-lg bg-card lg:h-9" />
                <Bone className="h-3 w-2" />
                <Bone className="h-11 w-24 rounded-lg bg-card lg:h-9" />
              </div>
              <Bone className="mt-3 h-3 w-44" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i}>
                  <Bone className="h-3 w-24" />
                  <Bone className="mt-1.5 h-12 w-full rounded-lg lg:h-10" />
                </div>
              ))}
            </div>
            <Bone tone="dark" className="mt-5 h-12 w-36 rounded-full lg:h-10" />
          </SkeletonCard>
        </SectionBone>
      </div>
    </SkeletonPage>
  );
}
