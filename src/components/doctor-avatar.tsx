import Image from "next/image";

const sizes = {
  sm: { box: "size-8 text-[11px]", px: 32 },
  md: { box: "size-10 text-[13px]", px: 40 },
  hero: { box: "size-11.5 text-[15px]", px: 46 },
  lg: { box: "size-16 text-xl", px: 64 },
  xl: { box: "size-24 text-3xl sm:size-28", px: 112 },
};

/** The doctor's photo, or their initials on the brand's orange until they add one, as in the app. */
export function DoctorAvatar({
  photoUrl,
  initials,
  size = "sm",
  className = "",
}: {
  photoUrl?: string;
  initials: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { box, px } = sizes[size];
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand-mid to-brand font-bold text-white ${box} ${className}`}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt="" fill sizes={`${px}px`} className="object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
