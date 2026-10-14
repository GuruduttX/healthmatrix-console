import { Bone, ConsultRowBone, SectionBone, SkeletonCard, SkeletonPage, TileRowsBone } from "@/components/skeletons";
import { bleed } from "@/components/hero";

/** Today: the greeting header, the counts riding over it, the next consult, and the day's lists. */
export default function TodayLoading() {
  return (
    <SkeletonPage>
      <div
        className={`hero-bg rounded-b-[2rem] px-4 pb-18 pt-[calc(env(safe-area-inset-top)+0.875rem)] sm:px-6 lg:rounded-3xl lg:px-8 lg:pb-20 lg:pt-8 ${bleed}`}
      >
        <div className="flex items-center gap-3">
          <Bone tone="glass" className="size-12.5 shrink-0 rounded-full lg:hidden" />
          <div className="min-w-0 flex-1">
            <Bone tone="glass" className="h-3.5 w-28" />
            <Bone tone="glass" className="mt-2.5 h-7 w-44 lg:w-72" />
          </div>
          <Bone tone="glass" className="size-11 shrink-0 rounded-full lg:hidden" />
          <Bone tone="glass" className="size-11 shrink-0 rounded-full lg:hidden" />
        </div>
        <Bone tone="glass" className="mt-4 h-3.5 w-64 max-w-full" />
      </div>

      <div className="relative z-10 -mt-12 grid grid-cols-4 rounded-3xl border border-line bg-card px-1 pb-3.5 pt-4 shadow-lifted lg:-mt-14 lg:gap-1 lg:p-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 lg:flex-row lg:gap-3.5 lg:p-3">
            <Bone className="size-14 rounded-[1.1875rem] lg:size-12 lg:rounded-2xl" />
            <div className="flex flex-col items-center gap-1.5 lg:items-start">
              <Bone className="h-5.5 w-7" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-7 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start xl:gap-6">
        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
          <SectionBone width="w-24">
            <div className="teal-bg rounded-3xl p-4 sm:p-5">
              <div className="flex justify-between">
                <Bone tone="glass" className="h-6.5 w-32 rounded-full" />
                <Bone tone="glass" className="h-6.5 w-28 rounded-full" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Bone tone="glass" className="size-12 rounded-full" />
                <div>
                  <Bone tone="glass" className="h-5 w-36" />
                  <Bone tone="glass" className="mt-2 h-3 w-24" />
                </div>
              </div>
              <Bone tone="glass" className="mt-4 h-3.5 w-4/5" />
              <Bone tone="glass" className="mt-4 h-16 w-full rounded-2xl sm:ml-auto sm:w-72" />
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

        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
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
