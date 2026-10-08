import { AvatarBone, Bone, ChipBone, FilterBones, HeadingBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Results: status filters, then each order with its test and value. */
export default function ResultsLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={1} />
      <FilterBones widths={["w-14", "w-28", "w-24", "w-24"]} />
      <PhoneListBone
        row={() => (
          <>
            <div className="flex items-center gap-2.5">
              <AvatarBone size="sm" />
              <Bone className="h-4 flex-1" />
              <ChipBone width="w-20" />
            </div>
            <Bone className="mt-3 h-3.5 w-40" />
            <div className="mt-2 flex items-center gap-2">
              <Bone className="h-3.5 w-14" />
              <ChipBone />
            </div>
            <Bone className="mt-2 h-3 w-48 max-w-full" />
          </>
        )}
      />
      <TableBone columns={["w-44", "w-36", "w-20", "flex-1", "w-28", "w-20", "w-24"]} />
    </SkeletonPage>
  );
}
