"use client";

import { useId, useState } from "react";

import type { ChartSpec } from "@/lib/types";

/** Close to the width the chart is drawn at, so its labels stay readable at 11–12 px. */
const W = 320;
const H = 168;
const PAD = { left: 34, right: 14, top: 22, bottom: 26 };

/** Fixed series order: colour follows the series, never its rank. */
const SERIES_COLORS = ["#DD4301", "#244C56"];
/** The normal range is a quiet grey band; its label says what it is. */
const BAND_FILL = { success: "#EEF2F3", warning: "#FBF1D8" };

export function LineChart({ spec }: { spec: ChartSpec }) {
  const [hover, setHover] = useState<number | null>(null);
  // Plain characters only: the id goes inside an SVG `url(#…)`.
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const { labels, series, bands = [], refLines } = spec;
  const n = labels.length;

  const all = [
    ...series.flatMap((s) => s.values),
    ...bands.flatMap((b) => [b.from, b.to]),
    ...(refLines ?? []),
  ];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const margin = (hi - lo) * 0.08 || 1;
  const yMin = lo - margin;
  const yMax = hi + margin;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + 12 + (n === 1 ? 0 : (i * (plotW - 24)) / (n - 1));
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;

  const bandEdges = [...new Set([...bands.map((b) => b.from), ...bands.slice(-1).map((b) => b.to)])];
  const ticks = refLines ?? (bands.length > 0 ? bandEdges : [lo, (lo + hi) / 2, hi]);
  const format = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const labelEvery = n <= 3;
  const showXLabel = (i: number) => n <= 4 || i === 0 || i === n - 1;
  const step = n > 1 ? x(1) - x(0) : plotW;

  return (
    <figure>
      {series.length > 1 ? (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ background: SERIES_COLORS[i] }}
              />
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
          {bands.map((b) => (
            <rect
              key={b.label}
              x={PAD.left}
              y={y(b.to)}
              width={plotW}
              height={y(b.from) - y(b.to)}
              fill={BAND_FILL[b.tone]}
            />
          ))}

          {ticks.map((t) => (
            <g key={t}>
              {bands.length === 0 ? (
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#E3E8E9" strokeWidth="1" />
              ) : null}
              <text x={PAD.left - 7} y={y(t) + 4} fontSize="11" textAnchor="end" fill="#87979B" className="tabular-nums">
                {format(t)}
              </text>
            </g>
          ))}

          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#8A9A9E"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ) : null}

          {/* A soft wash under the first series, fading to nothing at the baseline. */}
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLORS[0]} stopOpacity="0.16" />
              <stop offset="100%" stopColor={SERIES_COLORS[0]} stopOpacity="0" />
            </linearGradient>
          </defs>
          {series[0] && n > 1 ? (
            <polygon
              points={[
                `${x(0)},${H - PAD.bottom}`,
                ...series[0].values.map((v, i) => `${x(i)},${y(v)}`),
                `${x(n - 1)},${H - PAD.bottom}`,
              ].join(" ")}
              fill={`url(#${gradientId}-area)`}
            />
          ) : null}

          {series.map((s, si) => (
            <g key={s.name}>
              <polyline
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={SERIES_COLORS[si]}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <g key={i}>
                  <circle
                    cx={x(i)}
                    cy={y(v)}
                    r={hover === i ? 5 : 4}
                    fill={SERIES_COLORS[si]}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {labelEvery || i === n - 1 ? (
                    <text
                      x={x(i)}
                      y={y(v) - 10}
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                      fill="#0E2A33"
                    >
                      {format(v)}
                    </text>
                  ) : null}
                </g>
              ))}
            </g>
          ))}

          {labels.map((label, i) =>
            showXLabel(i) ? (
              <text
                key={label}
                x={x(i)}
                y={H - 6}
                fontSize="11"
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                dx={i === 0 ? -10 : i === n - 1 ? 10 : 0}
                fill="#87979B"
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Hit targets wider than the marks */}
          {labels.map((label, i) => (
            <rect
              key={label}
              x={x(i) - step / 2}
              y={PAD.top}
              width={step}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {hover !== null ? (
          <div
            role="presentation"
            className="pointer-events-none absolute top-0 z-10 min-w-28 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-floating"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover === 0 ? "0" : hover === n - 1 ? "-100%" : "-50%"})`,
            }}
          >
            <p className="font-semibold">{labels[hover]}</p>
            {series.map((s, i) => (
              <p key={s.name} className="mt-1 flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full ring-1 ring-white/70"
                  style={{ background: SERIES_COLORS[i] }}
                />
                <span className="text-white/75">{s.name}</span>
                <span className="ml-auto pl-2 font-semibold">
                  {format(s.values[hover])} {spec.unit}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {bands.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-body">
          {bands.map((b) => (
            <li key={b.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-sm border border-line"
                style={{ background: BAND_FILL[b.tone] }}
              />
              {b.label}
            </li>
          ))}
        </ul>
      ) : null}

      {spec.caption ? <figcaption className="mt-1 text-xs text-muted">{spec.caption}</figcaption> : null}

      <table className="sr-only">
        <caption>
          {spec.title}, {spec.unit}
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {series.map((s) => (
              <th key={s.name} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.name}>{format(s.values[i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
