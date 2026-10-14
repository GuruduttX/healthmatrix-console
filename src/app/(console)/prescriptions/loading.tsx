import { AvatarBone, Bone, ChipBone, HeroBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Prescriptions: the header with New prescription and filters, then drafts and signed ones. */
export default function PrescriptionsLoading() {
  return (
    <SkeletonPage>
      <HeroBone title="Prescriptions" lines={1} action filters={["w-12", "w-32", "w-20"]} />
      <PhoneListBone
        row={() => (
          <div className="flex items-start gap-3">
            <AvatarBone />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <Bone className="h-4.5 flex-1" />
                <ChipBone width="w-14" />
              </div>
              <Bone className="mt-3 h-3.5 w-full" />
              <Bone className="mt-1.5 h-3.5 w-3/5" />
              <Bone className="mt-2 h-3 w-36" />
            </div>
            <Bone className="mt-3 size-4 shrink-0" />
          </div>
        )}
      />
      <TableBone columns={["w-44", "flex-1", "w-28", "w-20", "w-16", "w-28"]} />
    </SkeletonPage>
  );
}
