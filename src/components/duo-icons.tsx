import type { ReactNode, SVGProps } from "react";

/**
 * The glass look's small icons: two-tone, a soft fill of the colour behind a crisp outline, both
 * in `currentColor`; `BrandIcon` sets them in a round of glass in deep orange. 24px grid. The big
 * ones are glass glyphs (`glass-glyphs.tsx`).
 */
export type DuoIcon = (props: SVGProps<SVGSVGElement>) => ReactNode;

/** The soft half of a two-tone icon. */
const fill = { fill: "currentColor", fillOpacity: 0.22 } as const;

function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** A flask with something in it: a lab result. */
export const DuoFlask: DuoIcon = (props) => (
  <Svg {...props}>
    <path d="M6.9 14.25h10.2l1.6 2.95a2.7 2.7 0 0 1-2.37 4.05H7.67A2.7 2.7 0 0 1 5.3 17.2Z" {...fill} stroke="none" />
    <path d="M9.25 2.75h5.5M10.25 2.75v5.4L5.3 17.2a2.7 2.7 0 0 0 2.37 4.05h8.66a2.7 2.7 0 0 0 2.37-4.05l-4.95-9.05v-5.4" />
    <circle cx="10.4" cy="17.7" r="1" fill="currentColor" stroke="none" />
    <circle cx="13.6" cy="16.4" r=".75" fill="currentColor" stroke="none" />
  </Svg>
);

/** A day on the calendar. */
export const DuoCalendar: DuoIcon = (props) => (
  <Svg {...props}>
    <rect x="3.25" y="4.75" width="17.5" height="16" rx="3.5" {...fill} />
    <path d="M3.25 9.75h17.5M8 2.75v4M16 2.75v4" />
    <path d="M7.75 13.75h.01M12 13.75h.01M16.25 13.75h.01M7.75 17h.01M12 17h.01" strokeWidth={2.4} />
  </Svg>
);

/** A heart with a heartbeat across it: readings to look at. */
export const DuoPulse: DuoIcon = (props) => (
  <Svg {...props}>
    <path d="M12 20.5S3.5 15.6 3.5 9.6A4.6 4.6 0 0 1 12 7.2a4.6 4.6 0 0 1 8.5 2.4c0 6-8.5 10.9-8.5 10.9Z" {...fill} />
    <path d="M2.75 12.75h4.1l1.6-2.75 2.6 5.25 2.15-3.75 1.1 1.25h6.95" />
  </Svg>
);
