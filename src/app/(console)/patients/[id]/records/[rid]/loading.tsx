import { Bone, ChipBone, PatientHeaderBone, SkeletonCard, SkeletonPage, TextCardBone } from "@/components/skeletons";

/** One record entry: header, the entry's values, and where it came from. */
export default function RecordLoading() {
  return (
    <SkeletonPage>
      <PatientHeaderBone />

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SkeletonCard>
          <div className="flex flex-wrap items-center gap-3">
            <Bone className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Bone className="h-5 w-48 max-w-full" />
              <Bone className="mt-2 h-3.5 w-32" />
            </div>
            <ChipBone width="w-24" />
          </div>
          <div className="mt-5 divide-y divide-line border-t border-line">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Bone className={`h-3.5 ${i % 2 ? "w-24" : "w-32"}`} />
                <Bone className="hidden h-1.5 flex-1 sm:block" />
                <Bone className="ml-auto h-3.5 w-14 sm:ml-0" />
                <ChipBone width="w-14" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <div className="flex min-w-0 flex-col gap-5">
          <TextCardBone highlight title="w-28" lines={3} />
          <TextCardBone title="w-36" lines={2} />
        </div>
      </div>
    </SkeletonPage>
  );
}
