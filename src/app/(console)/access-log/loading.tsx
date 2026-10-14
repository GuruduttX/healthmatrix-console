import { AvatarBone, Bone, ChipBone, PhoneListBone, SkeletonPage, StackBone, TableBone } from "@/components/skeletons";

/** Access log: every record request, as a list on phones and a table on wider screens. */
export default function AccessLogLoading() {
  return (
    <SkeletonPage>
      <StackBone lines={2} />
      <PhoneListBone
        row={() => (
          <div className="flex items-start gap-3">
            <AvatarBone />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <Bone className="h-4.5 flex-1" />
                <ChipBone width="w-24" />
              </div>
              <Bone className="mt-3 h-3.5 w-44" />
              <Bone className="mt-2 h-3 w-52 max-w-full" />
            </div>
          </div>
        )}
      />
      <TableBone columns={["w-28", "w-44", "flex-1", "w-28", "w-24"]} />
    </SkeletonPage>
  );
}
