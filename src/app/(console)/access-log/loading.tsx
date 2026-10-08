import { AvatarBone, Bone, ChipBone, HeadingBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Access log: every record request, as a list on phones and a table on wider screens. */
export default function AccessLogLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={2} />
      <PhoneListBone
        row={() => (
          <>
            <div className="flex items-center gap-2.5">
              <AvatarBone size="sm" />
              <Bone className="h-4 flex-1" />
              <ChipBone width="w-16" />
            </div>
            <Bone className="mt-3 h-3.5 w-44" />
            <Bone className="mt-2 h-3 w-52 max-w-full" />
          </>
        )}
      />
      <TableBone columns={["w-28", "w-44", "flex-1", "w-28", "w-20"]} />
    </SkeletonPage>
  );
}
