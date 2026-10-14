import { Bone, ChipBone, HeroBone, PhoneListBone, SkeletonPage, TableBone, TileBone } from "@/components/skeletons";

/** Results: the header with status filters, then each order with its test and value. */
export default function ResultsLoading() {
  return (
    <SkeletonPage>
      <HeroBone title="Results" lines={2} filters={["w-12", "w-30", "w-22", "w-34"]} />
      <PhoneListBone
        row={() => (
          <div className="flex items-start gap-3">
            <TileBone />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <Bone className="h-4.5 flex-1" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="mt-2.5 h-3.5 w-40" />
              <div className="mt-2.5 flex items-center gap-2">
                <Bone className="h-4 w-16" />
                <ChipBone />
              </div>
              <Bone className="mt-2.5 h-3 w-48 max-w-full" />
            </div>
          </div>
        )}
      />
      <TableBone columns={["w-44", "w-36", "w-20", "flex-1", "w-28", "w-20", "w-24"]} />
    </SkeletonPage>
  );
}
