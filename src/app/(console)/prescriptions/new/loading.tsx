import { Bone, SkeletonCard, SkeletonPage, StackBone } from "@/components/skeletons";

/** New prescription: pick the patient, the three ways to capture, and the safety checks. */
export default function NewPrescriptionLoading() {
  return (
    <SkeletonPage>
      <StackBone lines={2} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <SkeletonCard>
            <div className="flex items-center gap-2.5">
              <Bone tone="brand" className="size-7 rounded-full" />
              <Bone className="h-4.5 w-20" />
            </div>
            <Bone className="mt-3 h-12 w-full rounded-lg lg:h-10" />
            <Bone className="mt-2.5 h-3 w-4/5" />
          </SkeletonCard>
          <SkeletonCard>
            <div className="flex items-center gap-2.5">
              <Bone tone="brand" className="size-7 rounded-full" />
              <Bone className="h-4.5 w-20" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-2 py-4">
                  <Bone className="size-5" />
                  <Bone className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        <SkeletonCard>
          <div className="flex items-center gap-2.5">
            <Bone className="size-8 rounded-[0.625rem]" />
            <Bone className="h-4.5 w-28" />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i}>
                <Bone className="h-3 w-32" />
                <Bone className="mt-2 h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
