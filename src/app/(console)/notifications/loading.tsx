import { Bone, SectionBone, SkeletonCard, SkeletonPage, StackBone, TileBone } from "@/components/skeletons";

/** Notifications: new ones, then earlier ones, each an icon tile, a title, a line and the time. */
export default function NotificationsLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-3xl lg:mx-0">
        <StackBone lines={2} action />
        <SectionBone width="w-16">
          <SkeletonCard flush>
            <ul className="divide-y divide-line">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex gap-3 px-4 py-3.5 sm:px-5">
                  <TileBone />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Bone className={`h-4 ${i % 2 ? "w-40" : "w-52"} max-w-full`} />
                      <Bone className="ml-auto h-3 w-12 shrink-0" />
                    </div>
                    <Bone className="mt-2.5 h-3.5 w-full" />
                    {i % 3 === 0 ? <Bone className="mt-1.5 h-3.5 w-2/3" /> : null}
                  </div>
                </li>
              ))}
            </ul>
          </SkeletonCard>
        </SectionBone>
      </div>
    </SkeletonPage>
  );
}
