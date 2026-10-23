import Image from "next/image";

/** The logo and wordmark, with the "for doctors" line under it on the larger size. */
export function Brand({ size = "md" }: { size?: "sm" | "md" }) {
  const small = size === "sm";
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/logo-mark.png" width={small ? 30 : 36} height={small ? 30 : 36} alt="" />
      <span className="leading-none">
        <span className={`font-display font-extrabold tracking-[-0.04em] ${small ? "text-lg" : "text-[1.375rem]"}`}>
          health<span className="text-brand-deep">matrix</span>
        </span>
        {small ? null : <span className="mt-1 block text-[0.5625rem] font-bold tracking-[0.28em] text-muted">FOR DOCTORS</span>}
      </span>
    </span>
  );
}
