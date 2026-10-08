import { AvatarBone, Bone, ChipBone, FilterBones, HeadingBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Patients: filters, then a tappable list on phones and a table on wider screens. */
export default function PatientsLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={3} />
      <FilterBones widths={["w-14", "w-28", "w-24", "w-24"]} />
      <PhoneListBone
        row={(i) => (
          <div className="flex items-center gap-3">
            <AvatarBone />
            <div className="min-w-0 flex-1">
              <Bone className="h-4 w-36" />
              <Bone className="mt-2 h-3 w-28" />
              <Bone className="mt-1.5 h-3 w-24" />
              <div className="mt-2.5 flex gap-1.5">
                <ChipBone width="w-20" />
                {i % 2 ? <ChipBone width="w-24" /> : null}
              </div>
            </div>
            <Bone className="size-4 shrink-0 rounded-md" />
          </div>
        )}
      />
      <TableBone columns={["w-56", "w-16", "w-20", "flex-1", "w-20", "w-20", "w-24"]} />
    </SkeletonPage>
  );
}
