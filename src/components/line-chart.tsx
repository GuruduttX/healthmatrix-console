"use client";

import { useState } from "react";

import type { ChartSpec } from "@/lib/types";

const W = 360;
const H = 170;
const PAD = { left: 30, right: 16, top: 18, bottom: 24 };

/** Fixed series order: colour follows the series, never its rank. */
const SERIES_COLORS = ["#DD4301", "#00809A"];
const BAND_FILL = { success: "#DAF0EA", warning: "#FBEFD2" };

export function LineChart({ spec }: { spec: ChartSpec }) {
  const [hover, setHover] = useState<number | null>(null);

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
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#D3DFE0" strokeWidth="1" />
              ) : null}
              <text x={PAD.left - 6} y={y(t) + 3} fontSize="9" textAnchor="end" fill="#4D6368">
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
                      y={y(v) - 9}
                      fontSize="10"
                      fontWeight="700"
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
                y={H - 7}
                fontSize="9"
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                dx={i === 0 ? -10 : i === n - 1 ? 10 : 0}
                fill="#4D6368"
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

      {spec.caption ? <figcaption className="mt-1 text-xs text-body">{spec.caption}</figcaption> : null}

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
