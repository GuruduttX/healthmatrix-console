import { Bone, SkeletonPage } from "@/components/skeletons";
import { bleed } from "@/components/hero";

/**
 * Edit profile: the app's bar and one column on phones; on wide screens the photo card beside
 * the section cards.
 */
export default function EditProfileLoading() {
  return (
    <SkeletonPage>
      {/* Phones: the bar with back, title and progress, as the form draws it. */}
      <div className={`flex items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:hidden ${bleed}`}>
        <Bone className="size-11 rounded-full bg-card shadow-card ring-1 ring-line-strong" />
        <Bone className="mx-auto h-4.5 w-28" />
        <Bone className="h-3 w-8" />
      </div>
      <div className="mb-6 hidden lg:block">
        <Bone className="mb-3 h-6 w-40 rounded-full" />
        <Bone className="h-9 w-48" />
        <Bone className="mt-3 h-3.5 w-80" />
      </div>

      <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:grid lg:max-w-6xl lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="mt-2 lg:mt-0 lg:rounded-xl lg:border lg:border-line lg:bg-card lg:p-5 lg:shadow-card">
          <div className="flex flex-col items-center">
            <Bone className="size-24 rounded-full" />
            <Bone className="mt-3 h-3.5 w-24" />
            <Bone className="mt-2 hidden h-5 w-36 lg:block" />
            <Bone className="mt-2 hidden h-3.5 w-28 lg:block" />
          </div>
          <div className="mx-auto mt-3 max-w-xs lg:mt-5 lg:max-w-none lg:border-t lg:border-line lg:pt-4">
            <Bone className="h-2 w-full rounded-full" />
            <div className="mt-4 hidden flex-col gap-3 lg:flex">
              {Array.from({ length: 3 }, (_, i) => (
                <Bone key={i} className="h-3.5 w-40" />
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {[3, 2, 2].map((fields, s) => (
            <div key={s} className={`mt-7 ${s === 0 ? "lg:mt-0" : "lg:mt-5"}`}>
              <div className="px-1 lg:hidden">
                <Bone className="h-5 w-28" />
                <Bone className="mt-2 h-3 w-56 max-w-full" />
              </div>
              <div className="mt-3 rounded-xl border border-line bg-card shadow-card lg:mt-0">
                <div className="hidden border-b border-line px-5 py-4 lg:block">
                  <Bone className="h-4.5 w-28" />
                  <Bone className="mt-2 h-3.5 w-56" />
                </div>
                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2">
                  {Array.from({ length: fields }, (_, i) => (
                    <div key={i} className={s === 0 && i === 2 ? "lg:col-span-2" : ""}>
                      <Bone className="h-3.5 w-28" />
                      <Bone className={`mt-2 w-full rounded-lg ${s === 0 && i === 2 ? "h-28" : "h-12 lg:h-10"}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
