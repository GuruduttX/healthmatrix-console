import { Bone, ChipBone, SkeletonCard, SkeletonPage, StackBone } from "@/components/skeletons";

/**
 * A consult: the video stage, the reason, and the record panel beside it. The stage is the glass
 * pane it shows before the call (it turns dark only once the call is live).
 */
export default function ConsultLoading() {
  return (
    <SkeletonPage>
      <StackBone eyebrow lines={1} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="glass-panel flex aspect-video min-h-96 w-full flex-col items-center justify-center rounded-3xl">
            <Bone className="size-30 rounded-full" />
            <Bone className="mt-4 h-5 w-40" />
            <Bone className="mt-2 h-3.5 w-28" />
          </div>
          <SkeletonCard>
            <Bone className="h-3 w-36" />
            <Bone className="mt-2.5 h-4 w-3/4" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ChipBone width="w-24" />
              <ChipBone width="w-32" />
              <Bone className="h-10 w-full rounded-full sm:ml-auto sm:h-8.5 sm:w-36" />
            </div>
          </SkeletonCard>
        </div>

        <SkeletonCard>
          {/* The tabs, as `segmented` draws them: the first one chosen. */}
          <div className="segmented">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex h-10 flex-1 items-center justify-center rounded-full lg:h-8.5 ${i === 0 ? "bg-white/92 shadow-card" : ""}`}
              >
                <Bone className="h-3 w-14 max-w-[70%]" />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-4/5" />
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-1/2" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
