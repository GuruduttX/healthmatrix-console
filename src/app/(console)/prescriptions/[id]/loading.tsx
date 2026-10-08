import { Bone, ChipBone, SkeletonPage } from "@/components/skeletons";

/** One prescription: the letterhead page with the doctor, the patient and the items. */
export default function PrescriptionLoading() {
  return (
    <SkeletonPage>
      <Bone className="h-4 w-28" />
      <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-line bg-card p-8 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <Bone className="h-6 w-44" />
            <Bone className="mt-2 h-3.5 w-52 max-w-full" />
            <Bone className="mt-1.5 h-3.5 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Bone className="size-7 rounded-md" />
            <Bone className="h-5 w-28" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Bone className="h-5 w-36" />
            <Bone className="mt-2 h-3.5 w-44" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ChipBone width="w-20" />
            <Bone className="h-3.5 w-24" />
          </div>
        </div>
        <div className="mt-5 divide-y divide-line border-t border-line">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <Bone className="h-4 w-4 shrink-0" />
              <Bone className={`h-4 ${i % 2 ? "w-3/5" : "w-4/5"}`} />
            </div>
          ))}
        </div>
        <Bone className="mt-6 h-3.5 w-full" />
        <Bone className="mt-2 h-3.5 w-1/2" />
      </div>
    </SkeletonPage>
  );
}
