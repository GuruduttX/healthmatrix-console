import { Bone, HeadingBone, SkeletonCard, SkeletonPage } from "@/components/skeletons";

/** New prescription: pick the patient, the three ways to capture, and the safety checks. */
export default function NewPrescriptionLoading() {
  return (
    <SkeletonPage>
      <HeadingBone back lines={2} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <SkeletonCard>
            <Bone className="h-4 w-28" />
            <Bone className="mt-3 h-12 w-full rounded-xl" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Bone className="h-8 w-32" />
              <Bone className="h-8 w-28" />
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <Bone className="h-4 w-20" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-line p-4">
                  <Bone className="size-6 rounded-md" />
                  <Bone className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        <SkeletonCard>
          <Bone className="h-4 w-28" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i}>
                <Bone className="h-3.5 w-32" />
                <Bone className="mt-2 h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
