import { Bone, SectionBone, SkeletonCard, SkeletonPage, TileRowsBone, TitleBone } from "@/components/skeletons";
import { bleed } from "@/components/hero";

/** Profile: the glass card with the photo, then details, alerts and the account rows. */
export default function ProfileLoading() {
  return (
    <SkeletonPage>
      {/* Phones: the bar's round back button. Wide screens: the back link. */}
      <div className={`flex items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:hidden ${bleed}`}>
        <Bone tone="frost" className="size-11 rounded-full" />
      </div>
      <Bone className="mb-3 hidden h-6 w-24 rounded-full lg:block" />

      <div className="glass-panel mt-2 rounded-2xl px-4 py-5 sm:px-6 lg:mt-0 lg:px-7 lg:py-6">
        <div className="flex flex-col items-center gap-x-6 gap-y-3 lg:flex-row">
          <Bone className="size-26 shrink-0 rounded-full sm:size-30 lg:size-26" />
          <div className="flex flex-col items-center gap-2.5 lg:items-start">
            <Bone className="h-7 w-48" />
            <Bone className="h-3.5 w-60 max-w-full" />
            <div className="flex gap-1.5">
              <Bone className="h-6.5 w-36 rounded-full" />
              <Bone className="h-6.5 w-32 rounded-full" />
            </div>
          </div>
          <Bone className="ml-auto hidden h-8.5 w-32 shrink-0 rounded-full lg:block" />
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:mt-6 xl:grid-cols-2 xl:gap-6">
        <SkeletonCard>
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
          <SkeletonCard>
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
