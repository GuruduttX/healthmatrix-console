import { Bone, SkeletonPage } from "@/components/skeletons";

/**
 * Edit profile: the app-style top bar and one column on phones; on wide screens the photo
 * card beside the section cards.
 */
export default function EditProfileLoading() {
  return (
    <SkeletonPage>
      {/* Phones: the sticky bar with back, title and progress, as the form draws it. */}
      <div className="-mx-4 -mt-5 mb-5 flex items-center gap-2 border-b border-line bg-card px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:-mx-6 lg:hidden">
        <Bone className="m-2 size-6 rounded-md" />
        <Bone className="h-5 w-28 flex-1" />
        <Bone className="mr-3 h-3 w-20" />
      </div>
      <div className="hidden lg:block">
        <Bone className="h-4 w-36" />
        <Bone className="mt-3 h-8 w-48" />
        <Bone className="mt-3 h-4 w-80" />
      </div>

      <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:mt-6 lg:grid lg:max-w-6xl lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:rounded-2xl lg:border lg:border-line lg:bg-card lg:p-6 lg:shadow-card">
          <div className="flex flex-col items-center">
            <Bone className="size-28" />
            <Bone className="mt-3 h-3.5 w-24" />
            <Bone className="mt-2 hidden h-5 w-36 lg:block" />
            <Bone className="mt-2 hidden h-3.5 w-28 lg:block" />
          </div>
          <div className="mx-auto mt-4 max-w-xs lg:mt-6 lg:max-w-none lg:border-t lg:border-line lg:pt-5">
            <Bone className="h-1.5 w-full" />
            <div className="mt-4 hidden flex-col gap-3 lg:flex">
              {Array.from({ length: 3 }, (_, i) => (
                <Bone key={i} className="h-3.5 w-40" />
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {[3, 2, 2].map((fields, s) => (
            <div key={s} className={`mt-6 ${s === 0 ? "lg:mt-0" : ""}`}>
              <Bone className="mx-1 h-3 w-24 lg:hidden" />
              <div className="mt-2 rounded-2xl border border-line bg-card shadow-card lg:mt-0">
                <div className="hidden border-b border-line px-6 py-4 lg:block">
                  <Bone className="h-4 w-28" />
                  <Bone className="mt-2 h-3.5 w-56" />
                </div>
                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-2 lg:p-6">
                  {Array.from({ length: fields }, (_, i) => (
                    <div key={i} className={s === 0 && i === 2 ? "lg:col-span-2" : ""}>
                      <Bone className="h-3.5 w-28" />
                      <Bone className={`mt-2 w-full rounded-xl ${s === 0 && i === 2 ? "h-24" : "h-11"}`} />
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
