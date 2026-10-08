import { Bone, HeadingBone, SkeletonCard, SkeletonPage } from "@/components/skeletons";

/** Profile: the doctor's card (photo centred on phones), then settings cards. */
export default function ProfileLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={0} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <SkeletonCard>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Bone className="size-20 shrink-0 sm:size-16" />
            <div className="flex w-full flex-col items-center sm:items-start">
              <Bone className="h-6 w-44" />
              <Bone className="mt-2 h-3.5 w-56 max-w-full" />
            </div>
          </div>
          <Bone className="mt-5 h-20 w-full rounded-xl" />
          <div className="mt-5 divide-y divide-line border-t border-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex justify-between gap-6 py-3">
                <Bone className="h-3.5 w-24" />
                <Bone className={`h-3.5 ${i % 2 ? "w-28" : "w-36"}`} />
              </div>
            ))}
          </div>
          <Bone className="mt-4 h-11 w-full sm:hidden" />
        </SkeletonCard>

        <div className="flex min-w-0 flex-col gap-6">
          <SkeletonCard>
            <Bone className="h-4 w-24" />
            <Bone className="mt-2 h-3 w-64 max-w-full" />
            <div className="mt-4 flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Bone className="h-3.5 w-40" />
                    <Bone className="mt-1.5 h-3 w-52 max-w-full" />
                  </div>
                  <Bone className="h-6 w-10" />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <Bone className="h-4 w-24" />
            <Bone className="mt-3 h-3.5 w-full" />
            <Bone className="mt-2 h-3.5 w-3/4" />
            <Bone className="mt-4 h-10 w-28" />
          </SkeletonCard>
        </div>
      </div>
    </SkeletonPage>
  );
}
