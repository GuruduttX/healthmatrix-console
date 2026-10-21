import { Bone, ChipBone, SkeletonPage } from "@/components/skeletons";
import { bleed } from "@/components/hero";

/** One prescription: the letterhead, a pane of glass, with the doctor, the patient and the items. */
export default function PrescriptionLoading() {
  return (
    <SkeletonPage>
      <div className={`flex items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:hidden ${bleed}`}>
        <Bone tone="frost" className="size-11 rounded-full" />
        <Bone className="mx-auto h-4.5 w-32" />
        <span className="size-11" />
      </div>
      <div className="mx-auto max-w-2xl">
        <Bone className="mb-3 hidden h-6 w-32 rounded-full lg:block" />
      </div>
      <div className="glass-panel mx-auto mt-2 max-w-2xl rounded-2xl p-5 sm:p-10 lg:mt-1">
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
            <Bone className="h-5.5 w-36" />
            <Bone className="mt-2 h-3.5 w-44" />
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
            <ChipBone width="w-28" />
            <Bone className="h-3.5 w-24" />
          </div>
        </div>
        <Bone className="mt-4 h-10 w-full rounded-2xl" />
        <div className="mt-5 divide-y divide-line border-t border-line">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-3 py-3.5">
              <Bone className="size-4 shrink-0" />
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
