import { AvatarBone, Bone, ChipBone, FilterBones, HeadingBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Prescriptions: heading with the New button, filters, then drafts and signed ones. */
export default function PrescriptionsLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="w-full sm:w-auto sm:flex-1">
          <HeadingBone lines={2} />
        </div>
        <Bone tone="brand" className="h-11 w-full sm:h-10 sm:w-44" />
      </div>
      <FilterBones widths={["w-14", "w-20", "w-20"]} />
      <PhoneListBone
        row={() => (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <AvatarBone size="sm" />
                <Bone className="h-4 flex-1" />
                <ChipBone width="w-14" />
              </div>
              <Bone className="mt-3 h-3.5 w-full" />
              <Bone className="mt-1.5 h-3.5 w-3/5" />
              <Bone className="mt-2 h-3 w-36" />
            </div>
            <Bone className="size-4 shrink-0 rounded-md" />
          </div>
        )}
      />
      <TableBone columns={["w-44", "flex-1", "w-28", "w-20", "w-16", "w-28"]} />
    </SkeletonPage>
  );
}
