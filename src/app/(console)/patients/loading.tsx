import { AvatarBone, Bone, ChipBone, HeroBone, PhoneListBone, SkeletonPage, TableBone } from "@/components/skeletons";

/** Patients: the header with its search and filters, then a list on phones and a table wider. */
export default function PatientsLoading() {
  return (
    <SkeletonPage>
      <HeroBone title="Patients" lines={1} search filters={["w-12", "w-28", "w-30", "w-32", "w-24"]} />
      <PhoneListBone
        row={(i) => (
          <div className="flex items-start gap-3">
            <AvatarBone />
            <div className="min-w-0 flex-1">
              <Bone className="h-4.5 w-36" />
              <Bone className="mt-2 h-3.5 w-52 max-w-full" />
              <Bone className="mt-1.5 h-3 w-28" />
              <div className="mt-3 flex gap-1.5">
                <ChipBone width="w-24" />
                {i % 2 ? <ChipBone width="w-28" /> : null}
              </div>
            </div>
            <Bone className="mt-3 size-4 shrink-0" />
          </div>
        )}
      />
      <TableBone columns={["w-56", "w-16", "w-20", "flex-1", "w-20", "w-24", "w-28"]} />
    </SkeletonPage>
  );
}
