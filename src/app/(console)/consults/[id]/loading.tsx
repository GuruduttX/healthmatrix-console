import { Bone, ChipBone, HeadingBone, SkeletonCard, SkeletonPage, TitleBone } from "@/components/skeletons";

/** A consult: the dark video stage, the reason, and the record panel beside it. */
export default function ConsultLoading() {
  return (
    <SkeletonPage>
      <HeadingBone back lines={1} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex aspect-video min-h-80 w-full flex-col items-center justify-center rounded-3xl bg-linear-to-br from-ink-mid to-ink">
            <div className="size-28 rounded-full bg-white/10" />
            <div className="mt-4 h-6 w-40 rounded-full bg-white/10" />
            <div className="mt-2 h-3.5 w-28 rounded-full bg-white/10" />
            <div className="mt-6 h-11 w-40 rounded-full bg-brand/50" />
          </div>
          <SkeletonCard>
            <Bone className="h-4 w-40" />
            <Bone className="mt-2.5 h-4 w-3/4" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ChipBone width="w-20" />
              <ChipBone width="w-28" />
              <Bone className="ml-auto h-3.5 w-28" />
            </div>
          </SkeletonCard>
        </div>

        <SkeletonCard>
          <TitleBone width="w-32" />
          <div className="mt-4 flex gap-2">
            <Bone tone="dark" className="h-9 w-24" />
            <Bone className="h-9 w-24" />
            <Bone className="h-9 w-24" />
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
