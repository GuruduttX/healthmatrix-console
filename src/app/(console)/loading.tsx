import { Bone, ChipBone, ConsultRowBone, HeadingBone, SkeletonCard, SkeletonPage, TitleBone } from "@/components/skeletons";

/** Today: greeting, the four counts, today's consults and the side cards. */
export default function TodayLoading() {
  return (
    <SkeletonPage>
      <HeadingBone eyebrow lines={1} />

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i}>
            <Bone className="h-3.5 w-20" />
            <Bone className="mt-3 h-9 w-12 rounded-lg" />
            <Bone className="mt-2 h-3 w-24 max-w-full" />
          </SkeletonCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SkeletonCard flush>
          <div className="flex items-center justify-between px-5 pt-5">
            <TitleBone width="w-36" />
            <Bone className="h-3.5 w-20" />
          </div>
          <div className="mt-3 divide-y divide-line">
            {Array.from({ length: 3 }, (_, i) => (
              <ConsultRowBone key={i} />
            ))}
          </div>
        </SkeletonCard>

        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <TitleBone width="w-28" />
            <div className="mt-4 flex flex-col gap-4">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Bone className="mt-1 size-2 shrink-0" />
                  <div className="flex-1">
                    <Bone className="h-3.5 w-28" />
                    <Bone className="mt-2 h-3.5 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <TitleBone width="w-40" />
            <div className="mt-3 divide-y divide-line">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Bone className="size-8 shrink-0" />
                  <div className="flex-1">
                    <Bone className="h-3.5 w-28" />
                    <Bone className="mt-2 h-3 w-40 max-w-full" />
                  </div>
                  <Bone className="h-3.5 w-12" />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <TitleBone width="w-28" />
            <div className="mt-3 divide-y divide-line">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="py-3">
                  <Bone className="h-3.5 w-44 max-w-full" />
                  <div className="mt-2 flex items-center gap-2">
                    <Bone className="h-3.5 w-14" />
                    <ChipBone />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </SkeletonPage>
  );
}
