import type { ReactNode } from "react";

/**
 * The glass look's big icons, as the member app's quick actions (healthmatrix-app,
 * src/features/home/action-icons.tsx): an orange shape at the back and a pane of frosted glass in
 * front of it. Where the pane covers the shape, the shape shows through blurred and whitened, as
 * through real frosted glass. 32-point grid; `GlassDish` sets them in a round of glass.
 *
 * Each glyph's ids are its own and the same wherever it is drawn: two copies share identical
 * definitions, so it doesn't matter which one the page picks up.
 */
export type GlassGlyph = () => ReactNode;

/** Strokes and marks drawn on the glass: the brand orange, a step deeper so thin lines hold. */
const MARK = "#E2520E";

/** A rounded rectangle as a path, so it can be both drawn and used to clip. */
function roundRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** A plus with rounded ends: `a` is half its span, `t` half an arm's thickness. */
function plus(cx: number, cy: number, a: number, t: number, r: number) {
  return [
    `M${cx - t + r} ${cy - a} H${cx + t - r} Q${cx + t} ${cy - a} ${cx + t} ${cy - a + r} V${cy - t}`,
    `H${cx + a - r} Q${cx + a} ${cy - t} ${cx + a} ${cy - t + r} V${cy + t - r} Q${cx + a} ${cy + t} ${cx + a - r} ${cy + t}`,
    `H${cx + t} V${cy + a - r} Q${cx + t} ${cy + a} ${cx + t - r} ${cy + a} H${cx - t + r} Q${cx - t} ${cy + a} ${cx - t} ${cy + a - r}`,
    `V${cy + t} H${cx - a + r} Q${cx - a} ${cy + t} ${cx - a} ${cy + t - r} V${cy - t + r} Q${cx - a} ${cy - t} ${cx - a + r} ${cy - t}`,
    `H${cx - t} V${cy - a + r} Q${cx - t} ${cy - a} ${cx - t + r} ${cy - a} Z`,
  ].join(" ");
}

function Glyph({
  id,
  back,
  backMarks,
  glass,
  marks,
}: {
  id: string;
  /** The solid shape at the back, in the orange gradient. */
  back: string;
  /** More of the back, or marks on it; hidden where the glass covers it. Gets the orange. */
  backMarks?: (orange: string) => ReactNode;
  /** The pane of frosted glass in front. */
  glass: string;
  /** Marks on the glass. Gets a see-through orange tint. */
  marks?: (tint: string) => ReactNode;
}) {
  const orange = `url(#${id}-o)`;
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={`${id}-o`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FFB27D" />
          <stop offset="0.5" stopColor="#F47634" />
          <stop offset="1" stopColor="#DD4301" />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFCDB0" stopOpacity={0.72} />
        </linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F47634" stopOpacity={0.32} />
          <stop offset="1" stopColor="#DD4301" stopOpacity={0.22} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={glass} />
        </clipPath>
        <filter id={`${id}-b`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={1.5} />
        </filter>
        <filter id={`${id}-s`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={1.1} />
        </filter>
      </defs>

      <path d={back} fill={orange} fillRule="evenodd" />
      {backMarks?.(orange)}
      {/* The pane's soft shadow, warm, a little below it; the pane covers it but at the edges. */}
      <path d={glass} fill="#C84A10" fillOpacity={0.28} filter={`url(#${id}-s)`} transform="translate(0 1.1)" />
      {/* Through the pane: a white ground, then the back shape blurred. */}
      <g clipPath={`url(#${id}-c)`}>
        <rect width={32} height={32} fill="#FFFFFF" />
        <path d={back} fill={orange} fillRule="evenodd" filter={`url(#${id}-b)`} />
      </g>
      <path d={glass} fill={`url(#${id}-f)`} stroke="#FFFFFF" strokeWidth={0.8} />
      {marks?.(`url(#${id}-t)`)}
    </svg>
  );
}

/** Consults: a video camera with a glass medical cross over its corner. The app's own. */
export function ConsultGlyph() {
  return (
    <Glyph
      id="gg-consult"
      back={`${roundRect(2.5, 5.5, 19, 15, 4.5)} M23 11.1 L27.4 8.4 C28.4 7.8 29.6 8.5 29.6 9.7 V16.3 C29.6 17.5 28.4 18.2 27.4 17.6 L23 14.9 Z`}
      glass={plus(19.5, 20.5, 6.6, 3.1, 1.6)}
    />
  );
}

/** Records open to the doctor: an open padlock, and a glass record in front of it. */
export function RecordOpenGlyph() {
  return (
    <Glyph
      id="gg-record-open"
      back={roundRect(14, 15.5, 15.5, 13, 3.8)}
      backMarks={(orange) => (
        <>
          {/* The shackle, swung open. */}
          <path d="M17.55 15.5 V11.3 A4.2 4.2 0 0 1 25.39 9.2" stroke={orange} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <circle cx={23.6} cy={20.6} r={1.5} fill="#FFFFFF" fillOpacity={0.85} />
          <path d="M23.6 21.6 V24" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
      glass={roundRect(3, 12.5, 13.5, 17, 3.5)}
      marks={() => <path d="M6.4 18.2 H13 M6.4 21.8 H13 M6.4 25.4 H10.4" stroke={MARK} strokeWidth={1.7} strokeLinecap="round" />}
    />
  );
}

/** Prescriptions to sign: two sheets, the glass one in front with lines and a signature. */
export function SignGlyph() {
  return (
    <Glyph
      id="gg-sign"
      back={roundRect(11, 3, 17, 21, 4)}
      glass={roundRect(4.5, 8, 17.5, 21.5, 4)}
      marks={() => (
        <>
          <path d="M9 14.2 H17.5 M9 18.2 H14.2" stroke={MARK} strokeWidth={1.9} strokeLinecap="round" />
          <path
            d="M9 24.6 C10.2 22.9 11.1 22.9 11.6 24.6 S13 26.3 14.3 24.6 C14.9 23.8 15.8 23.8 16.3 24.6"
            stroke={MARK}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
    />
  );
}

/** New results: a glass flask, the orange behind it showing through as what it holds. */
export function ResultGlyph() {
  // The flask's lower part, below the level of what it holds.
  const held = "M7.3 20.5 H22.2 L24.3 24.6 C25.2 26.5 23.9 28.6 21.8 28.6 H7.7 C5.6 28.6 4.3 26.5 5.2 24.6 Z";
  return (
    <Glyph
      id="gg-result"
      back="M14.5 20.5 A7.5 7.5 0 1 0 29.5 20.5 A7.5 7.5 0 1 0 14.5 20.5 Z"
      glass="M12 3.5 H17.5 V11.3 L24.3 24.6 C25.2 26.5 23.9 28.6 21.8 28.6 H7.7 C5.6 28.6 4.3 26.5 5.2 24.6 L12 11.3 Z"
      marks={(tint) => (
        <>
          <path d={held} fill={tint} />
          <path d="M7.3 20.5 H22.2" stroke={MARK} strokeOpacity={0.55} strokeWidth={1.1} />
          <path d="M10.6 3.5 H18.9" stroke={MARK} strokeWidth={1.7} strokeLinecap="round" />
          <circle cx={11.4} cy={24.4} r={0.95} fill={MARK} fillOpacity={0.55} />
          <circle cx={14.6} cy={22.8} r={0.7} fill={MARK} fillOpacity={0.45} />
        </>
      )}
    />
  );
}
