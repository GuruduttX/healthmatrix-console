import { Bone, ConsultRowBone, SectionBone, SkeletonCard, SkeletonPage, TileRowsBone } from "@/components/skeletons";

/** Today, on the glass look: the greeting, the four counts, the next consult, and the day's lists. */
export default function TodayLoading() {
  return (
    <SkeletonPage>
      <div className="pt-[calc(env(safe-area-inset-top)+0.875rem)] lg:flex lg:items-end lg:justify-between lg:gap-6 lg:pt-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Bone className="size-12 shrink-0 rounded-full lg:hidden" />
            <div className="min-w-0 flex-1">
              <Bone className="h-3.5 w-28" />
              <Bone className="mt-2.5 h-7 w-44 lg:h-10 lg:w-80" />
            </div>
            <Bone className="size-11 shrink-0 rounded-full lg:hidden" />
            <Bone className="size-11 shrink-0 rounded-full lg:hidden" />
          </div>
          <div className="mt-3.5 flex gap-2">
            <Bone className="h-8 w-44 rounded-full" />
            <Bone className="h-8 w-36 rounded-full" />
          </div>
        </div>
        <div className="glass-panel hidden w-56 items-center gap-4 rounded-2xl py-3 pl-3 pr-6 lg:flex">
          <Bone className="size-14 shrink-0 rounded-full" />
          <div>
            <Bone className="h-3 w-20" />
            <Bone className="mt-2 h-4.5 w-24" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 max-lg:glass-panel max-lg:divide-x max-lg:divide-line max-lg:rounded-2xl max-lg:px-1 max-lg:py-3.5 lg:mt-7 lg:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 lg:glass-panel lg:items-start lg:gap-4 lg:rounded-2xl lg:p-5">
            <Bone className="size-13 rounded-full lg:size-14" />
            <div className="flex flex-col items-center gap-1.5 lg:items-start">
              <Bone className="h-5.5 w-7 lg:h-8 lg:w-10" />
              <Bone className="h-3 w-16 lg:w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-7 xl:mt-8 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start xl:gap-6">
        <div className="flex min-w-0 flex-col gap-7">
          <SectionBone width="w-24">
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex justify-between">
                <Bone className="h-6.5 w-32 rounded-full" />
                <Bone className="h-6.5 w-28 rounded-full" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Bone className="size-12 rounded-full" />
                <div>
                  <Bone className="h-5 w-36" />
                  <Bone className="mt-2 h-3 w-24" />
                </div>
              </div>
              <Bone className="mt-4 h-3.5 w-4/5" />
              <Bone className="mt-4 h-16 w-full rounded-2xl sm:ml-auto sm:w-72" />
            </div>
          </SectionBone>
          <SectionBone width="w-44">
            <SkeletonCard flush>
              <div className="divide-y divide-line">
                {Array.from({ length: 4 }, (_, i) => (
                  <ConsultRowBone key={i} />
                ))}
              </div>
            </SkeletonCard>
          </SectionBone>
        </div>

        <div className="flex min-w-0 flex-col gap-7">
          {["w-32", "w-44", "w-32"].map((width, i) => (
            <SectionBone key={i} width={width}>
              <TileRowsBone rows={2} avatar={i === 1} />
            </SectionBone>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
