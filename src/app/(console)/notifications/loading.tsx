import { Bone, HeadingBone, SkeletonPage } from "@/components/skeletons";

/** Notifications: one column of entries, each a dot, a title, a line and the time. */
export default function NotificationsLoading() {
  return (
    <SkeletonPage>
      <HeadingBone lines={2} />
      <ul className="mt-5 max-w-3xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex gap-4 px-5 py-4">
            <Bone className="mt-1.5 size-2.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <Bone className={`h-4 ${i % 2 ? "w-40" : "w-52"} max-w-full`} />
              <Bone className="mt-2 h-3.5 w-full" />
              {i % 3 === 0 ? <Bone className="mt-1.5 h-3.5 w-2/3" /> : null}
            </div>
            <Bone className="h-3 w-10 shrink-0" />
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
