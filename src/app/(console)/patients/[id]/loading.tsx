import { Bone, PatientHeroBone, RowsCardBone, SkeletonCard, SkeletonPage, TextCardBone, TitleBone } from "@/components/skeletons";

/** A patient: the dark header, then summary, medicines and timeline, charts and results, and the tools. */
export default function PatientLoading() {
  return (
    <SkeletonPage>
      <PatientHeroBone />

      <Bone className="mt-5 h-11 w-72 max-w-full rounded-2xl lg:mt-6" />

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5">
          <TextCardBone highlight title="w-32" lines={5} />
          <TextCardBone title="w-36" lines={2} />
          <SkeletonCard>
            <TitleBone width="w-20" />
            <div className="mt-3 divide-y divide-line">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Bone className="size-10 shrink-0 rounded-xl" />
                  <div className="flex-1">
                    <Bone className="h-4 w-36" />
                    <Bone className="mt-1.5 h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <SkeletonCard>
            <Bone className="h-4.5 w-36" />
            <Bone className="mt-4 h-36 w-full rounded-2xl" />
          </SkeletonCard>
          <RowsCardBone rows={4} chip />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:items-stretch">
          <SkeletonCard>
            <TitleBone width="w-28" />
            <Bone className="mt-4 h-32 w-full rounded-2xl" />
            <Bone tone="dark" className="ml-auto mt-4 h-10 w-24 rounded-full" />
          </SkeletonCard>
          <SkeletonCard>
            <TitleBone width="w-32" />
            <Bone className="mt-4 h-24 w-full rounded-2xl" />
          </SkeletonCard>
        </div>
      </div>
    </SkeletonPage>
  );
}
