import {
  Bone,
  ChipBone,
  FilterBones,
  PanelHeaderBone,
  PatientHeroBone,
  SkeletonCard,
  SkeletonPage,
  TextCardBone,
  TileBone,
  TitleBone,
} from "@/components/skeletons";

/**
 * A patient: the glass header card and the "record open" pill (with the jump pills on phones), then
 * summary, medicines and prescriptions, lab tests and charts, and the tools.
 */
export default function PatientLoading() {
  return (
    <SkeletonPage>
      <PatientHeroBone />

      <div className="mt-5 lg:mt-6">
        <Bone className="mb-5 h-10 w-72 max-w-full rounded-2xl" />
        <div className="mb-4 py-2 lg:hidden">
          <FilterBones widths={["w-24", "w-26", "w-22", "w-22", "w-24"]} />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5">
            <TextCardBone title="w-32" lines={5} />
            <SkeletonCard flush>
              <PanelHeaderBone width="w-36" />
              <div className="divide-y divide-line">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <Bone className="size-1.5 shrink-0 rounded-full" />
                    <Bone className={`h-3.5 max-w-full ${i % 2 ? "w-40" : "w-52"}`} />
                  </div>
                ))}
              </div>
            </SkeletonCard>
            <SkeletonCard flush>
              <PanelHeaderBone width="w-28" />
              <div className="divide-y divide-line">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <TileBone />
                    <div className="min-w-0 flex-1">
                      <Bone className="h-4 w-36 max-w-full" />
                      <Bone className="mt-1.5 h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <SkeletonCard flush>
              <PanelHeaderBone width="w-24" />
              <div className="divide-y divide-line">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <Bone className="h-4 w-40 max-w-full" />
                      <Bone className="mt-1.5 h-3 w-28" />
                    </div>
                    <ChipBone width="w-20" />
                  </div>
                ))}
              </div>
            </SkeletonCard>
            <SkeletonCard>
              <Bone className="h-4.5 w-36" />
              <Bone className="mt-4 h-36 w-full rounded-2xl" />
            </SkeletonCard>
          </div>

          <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:items-stretch">
            <SkeletonCard>
              <TitleBone width="w-28" />
              <Bone className="mt-4 h-32 w-full rounded-2xl" />
              <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
                <Bone className="h-12 w-28 rounded-full lg:h-10" />
                <Bone tone="brand" className="h-12 w-20 rounded-full lg:h-10" />
              </div>
            </SkeletonCard>
            <SkeletonCard>
              <TitleBone width="w-32" />
              <Bone className="mt-4 h-24 w-full rounded-2xl" />
            </SkeletonCard>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
