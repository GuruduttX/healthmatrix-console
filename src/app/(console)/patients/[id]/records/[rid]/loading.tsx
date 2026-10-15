import { Bone, ChipBone, PatientHeroBone, SkeletonCard, SkeletonPage, TextCardBone, TitleBone } from "@/components/skeletons";

/** One record entry: the patient's header, the entry, the notes on it side by side, then its values. */
export default function RecordLoading() {
  return (
    <SkeletonPage>
      <PatientHeroBone compact />

      <Bone className="mt-5 h-11 w-72 max-w-full rounded-2xl lg:mt-6" />

      <div className="mt-5 flex flex-col gap-5">
        <SkeletonCard>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Bone className="size-11 shrink-0 rounded-[0.875rem]" />
            <div className="min-w-0 flex-1">
              <Bone className="h-5 w-48 max-w-full" />
              <Bone className="mt-2 h-3.5 w-72 max-w-full" />
            </div>
            <Bone className="h-8.5 w-36 rounded-full max-sm:w-full" />
          </div>
        </SkeletonCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <TextCardBone highlight title="w-28" lines={3} />
          <TextCardBone title="w-36" lines={3} />
        </div>

        <SkeletonCard>
          <div className="flex items-center justify-between gap-3">
            <TitleBone width="w-20" />
            <ChipBone width="w-32" />
          </div>
          <div className="mt-4 divide-y divide-line border-t border-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <Bone className={`h-3.5 ${i % 2 ? "w-24" : "w-32"}`} />
                <Bone className="hidden h-2 flex-1 rounded-full sm:block" />
                <Bone className="ml-auto h-3.5 w-14 sm:ml-0" />
                <ChipBone width="w-14" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
