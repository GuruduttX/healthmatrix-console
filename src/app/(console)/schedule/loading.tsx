import { Bone, ConsultRowBone, HeadingBone, SkeletonCard, SkeletonPage, TitleBone } from "@/components/skeletons";

/** Schedule: consults by day on one side, availability and time off on the other. */
export default function ScheduleLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={2} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          {[2, 1].map((rows, i) => (
            <SkeletonCard key={i} flush>
              <div className="flex items-center justify-between gap-2 px-5 pt-5">
                <TitleBone width="w-16" />
                <Bone className="h-3 w-16" />
              </div>
              <div className="mt-3 divide-y divide-line">
                {Array.from({ length: rows }, (_, j) => (
                  <ConsultRowBone key={j} />
                ))}
              </div>
            </SkeletonCard>
          ))}
        </div>

        <SkeletonCard>
          <div className="flex items-center justify-between">
            <TitleBone width="w-24" />
            <Bone className="size-6" />
          </div>
          <Bone className="mt-3 h-3.5 w-4/5" />

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface p-3">
            <div className="flex-1">
              <Bone className="h-4 w-36" />
              <Bone className="mt-2 h-3 w-52 max-w-full" />
            </div>
            <Bone className="h-6 w-10" />
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            <Bone tone="dark" className="h-9 w-16" />
            {Array.from({ length: 7 }, (_, i) => (
              <Bone key={i} className="size-9" />
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-line p-3.5">
            <Bone className="h-3 w-40" />
            <div className="mt-3 flex items-center gap-1.5">
              <Bone className="h-9 w-24 rounded-lg" />
              <Bone className="h-3 w-2" />
              <Bone className="h-9 w-24 rounded-lg" />
            </div>
            <Bone className="mt-3 h-3 w-44" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}>
                <Bone className="h-3 w-24" />
                <Bone className="mt-1.5 h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Bone tone="brand" className="mt-4 h-9 w-32" />

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <TitleBone width="w-20" />
              <Bone className="size-6" />
            </div>
            <Bone className="mt-3 h-3 w-3/5" />
            <Bone className="mt-3 h-11 w-full" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
