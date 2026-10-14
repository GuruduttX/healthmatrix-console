import { Bone, SectionBone, SkeletonCard, SkeletonPage, TileRowsBone, TitleBone } from "@/components/skeletons";
import { bleed } from "@/components/hero";

/** Profile: the dark header with the photo, then details, alerts and the account rows. */
export default function ProfileLoading() {
  return (
    <SkeletonPage>
      <Bone className="mb-3 hidden h-6 w-24 rounded-full lg:block" />
      <div
        className={`hero-bg rounded-b-[2rem] px-4 pb-14 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:rounded-3xl lg:px-8 lg:pb-16 lg:pt-8 ${bleed}`}
      >
        <Bone tone="glass" className="mb-1 size-11 rounded-full lg:hidden" />
        <div className="flex flex-col items-center gap-x-6 gap-y-2.5 lg:flex-row">
          <Bone tone="glass" className="size-26 shrink-0 rounded-full sm:size-30 lg:size-26" />
          <div className="flex flex-col items-center gap-2.5 lg:items-start">
            <Bone tone="glass" className="h-7 w-48" />
            <Bone tone="glass" className="h-3.5 w-60" />
            <div className="flex gap-2">
              <Bone tone="glass" className="h-6.5 w-36 rounded-full" />
              <Bone tone="glass" className="h-6.5 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-9 grid items-start gap-5 lg:-mt-10 xl:grid-cols-2 xl:gap-6">
        <SkeletonCard className="shadow-lifted">
          <Bone className="h-4.5 w-24" />
          <Bone className="mt-3 h-24 w-full rounded-2xl" />
          <div className="mt-3 divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex justify-between gap-6 py-3">
                <Bone className="h-3.5 w-24" />
                <Bone className={`h-3.5 ${i % 2 ? "w-28" : "w-36"}`} />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
          <SkeletonCard className="xl:shadow-lifted">
            <TitleBone width="w-28" />
            <Bone className="mt-2.5 h-3 w-64 max-w-full" />
            <div className="mt-4 flex flex-col gap-5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Bone className="h-3.5 w-40" />
                    <Bone className="mt-1.5 h-3 w-52 max-w-full" />
                  </div>
                  <Bone className="h-7 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SectionBone width="w-24">
            <TileRowsBone rows={3} />
          </SectionBone>
        </div>
      </div>
    </SkeletonPage>
  );
}
