"use client";

import { useId, useMemo, useState } from "react";

/**
 * Small SVG charts for the superadmin console (always dark). Colours come from
 * a validated palette (first three categorical slots, dark steps); text never
 * wears a series colour. Every chart has a hover tooltip and a table view.
 */

export const SERIES_COLOURS = ["#3987e5", "#d95926", "#199e70"] as const;

export interface ChartSeries { name: string; values: number[] }
/** Named formats (functions can't be passed from server to client components). */
export type FormatId = "usd" | "count";
type Format = (value: number) => string;
const FORMATS: Record<FormatId, Format> = {
  usd: (value) => (Math.abs(value) >= 10_000 ? `$${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}K` : value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })),
  count: (value) => (value >= 10_000 ? `${(value / 1000).toFixed(1)}K` : Math.round(value).toLocaleString("en-US")),
};

const W = 720;
const H = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value / 4) ?? 10;
  return Math.ceil(value / (step * power)) * step * power;
}

function ticks(max: number): number[] { return [0, max / 4, max / 2, (max * 3) / 4, max]; }

function Legend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--c-text2)]">{series.map((item, i) => <li key={item.name} className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-[3px]" style={{ background: SERIES_COLOURS[i] }} />{item.name}</li>)}</ul>;
}

function TableView({ labels, series, format }: { labels: string[]; series: ChartSeries[]; format: Format }) {
  return <div className="max-h-64 overflow-auto rounded-lg border border-[var(--c-line)]"><table className="w-full text-left text-[12.5px]">
    <thead className="sticky top-0 bg-[var(--c-panel)] text-[var(--c-muted)]"><tr><th className="px-3 py-2 font-medium">Period</th>{series.map((item) => <th key={item.name} className="px-3 py-2 text-right font-medium">{item.name}</th>)}</tr></thead>
    <tbody>{labels.map((label, row) => <tr key={label + row} className="border-t border-[var(--c-line)] text-[var(--c-text)]"><td className="px-3 py-1.5">{label}</td>{series.map((item) => <td key={item.name} className="px-3 py-1.5 text-right tabular-nums">{format(item.values[row] ?? 0)}</td>)}</tr>)}</tbody>
  </table></div>;
}

function Frame({ title, subtitle, series, labels, format, children }: { title: string; subtitle?: string; series: ChartSeries[]; labels: string[]; format: Format; children: React.ReactNode }) {
  const [table, setTable] = useState(false);
  return <figure className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5">
    <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[14px] font-medium text-[var(--c-text)]">{title}</p>{subtitle && <p className="mt-0.5 text-[12px] text-[var(--c-muted)]">{subtitle}</p>}</div>
      <div className="flex items-center gap-4"><Legend series={series} /><button type="button" onClick={() => setTable(!table)} className="text-[12px] text-[var(--c-muted)] underline-offset-4 hover:text-[var(--c-text)] hover:underline">{table ? "Show chart" : "Show table"}</button></div>
    </figcaption>
    {table ? <TableView labels={labels} series={series} format={format} /> : children}
  </figure>;
}

function Axes({ max, labels, x, format }: { max: number; labels: string[]; x: (i: number) => number; format: Format }) {
  const y = (value: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - value / max);
  const every = Math.max(1, Math.ceil(labels.length / 8));
  return <g>
    {ticks(max).filter((tick, i, all) => i === 0 || format(tick) !== format(all[i - 1]!)).map((tick) => <g key={tick}><line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--c-grid)" strokeWidth={1} /><text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="var(--c-muted)">{format(tick)}</text></g>)}
    {labels.map((label, i) => (i % every === 0 ? <text key={label + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--c-muted)">{label}</text> : null))}
  </g>;
}

function Tooltip({ x, label, rows, format }: { x: number; label: string; rows: { name: string; value: number; colour: string }[]; format: Format }) {
  const left = `${Math.min(Math.max((x / W) * 100, 12), 80)}%`;
  return <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-[var(--c-line)] bg-[#232321] px-3 py-2 text-[12px] shadow-xl" style={{ left }}>
    <p className="mb-1 text-[var(--c-muted)]">{label}</p>
    {rows.map((row) => <p key={row.name} className="flex items-center gap-2 text-[var(--c-text)]"><span className="inline-block size-2 rounded-full" style={{ background: row.colour }} />{row.name}<span className="ml-auto pl-4 font-medium tabular-nums">{format(row.value)}</span></p>)}
    {rows.length > 1 && <p className="mt-1 flex border-t border-[var(--c-line)] pt-1 text-[var(--c-text2)]">Total<span className="ml-auto pl-4 tabular-nums">{format(rows.reduce((sum, row) => sum + row.value, 0))}</span></p>}
  </div>;
}

/** Stacked columns (e.g. revenue by source). 2px surface gap between segments, rounded top only. */
export function StackedColumns({ title, subtitle, labels, series, format: formatId }: { title: string; subtitle?: string; labels: string[]; series: ChartSeries[]; format: FormatId }) {
  const format = FORMATS[formatId];
  const [hover, setHover] = useState<number | null>(null);
  const totals = labels.map((_, i) => series.reduce((sum, item) => sum + (item.values[i] ?? 0), 0));
  const max = niceMax(Math.max(...totals, 0));
  const slot = (W - PAD.left - PAD.right) / Math.max(labels.length, 1);
  const bar = Math.min(24, slot * 0.6);
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const scale = (value: number) => ((H - PAD.top - PAD.bottom) * value) / max;
  const clip = useId();
  return <Frame title={title} subtitle={subtitle} series={series} labels={labels} format={format}>
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
        <Axes max={max} labels={labels} x={x} format={format} />
        {labels.map((label, i) => {
          let base = H - PAD.bottom;
          const top = base - scale(totals[i] ?? 0);
          return <g key={label + i}>
            <clipPath id={`${clip}-${i}`}><rect x={x(i) - bar / 2} y={top} width={bar} height={Math.max(0, base - top)} rx={4} /><rect x={x(i) - bar / 2} y={Math.max(top, base - 6)} width={bar} height={6} /></clipPath>
            <g clipPath={`url(#${clip}-${i})`} opacity={hover === null || hover === i ? 1 : 0.45}>{series.map((item, s) => {
              const height = scale(item.values[i] ?? 0);
              if (height <= 0) return null;
              base -= height;
              return <rect key={item.name} x={x(i) - bar / 2} y={base} width={bar} height={Math.max(0, height - (base > top + 0.5 ? 2 : 0))} fill={SERIES_COLOURS[s]} transform={`translate(0 ${base > top + 0.5 ? 2 : 0})`} />;
            })}</g>
            <rect x={x(i) - slot / 2} y={PAD.top} width={slot} height={H - PAD.top - PAD.bottom} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
          </g>;
        })}
      </svg>
      {hover !== null && <Tooltip x={x(hover)} label={labels[hover] ?? ""} rows={series.map((item, s) => ({ name: item.name, value: item.values[hover] ?? 0, colour: SERIES_COLOURS[s]! }))} format={format} />}
    </div>
  </Frame>;
}

/** Lines over time with a crosshair. One or two series on the same scale. */
export function LineChart({ title, subtitle, labels, series, format: formatId, area = false }: { title: string; subtitle?: string; labels: string[]; series: ChartSeries[]; format: FormatId; area?: boolean }) {
  const format = FORMATS[formatId];
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...series.flatMap((item) => item.values), 0));
  const span = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (labels.length > 1 ? (span * i) / (labels.length - 1) : span / 2);
  const y = (value: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - value / max);
  const paths = useMemo(() => series.map((item) => item.values.map((value, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(value).toFixed(1)}`).join("")), [series, max, labels.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / span) * (labels.length - 1));
    setHover(Math.min(Math.max(i, 0), labels.length - 1));
  };
  return <Frame title={title} subtitle={subtitle} series={series} labels={labels} format={format}>
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <Axes max={max} labels={labels} x={x} format={format} />
        {area && series[0] && <path d={`${paths[0]}L${x(labels.length - 1)},${H - PAD.bottom}L${x(0)},${H - PAD.bottom}Z`} fill={SERIES_COLOURS[0]} opacity={0.1} />}
        {paths.map((d, s) => <path key={series[s]!.name} d={d} fill="none" stroke={SERIES_COLOURS[s]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
        {series.map((item, s) => { const last = labels.length - 1; return <circle key={item.name} cx={x(last)} cy={y(item.values[last] ?? 0)} r={4} fill={SERIES_COLOURS[s]} stroke="var(--c-panel)" strokeWidth={2} />; })}
        {hover !== null && <g><line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--c-muted)" strokeWidth={1} />{series.map((item, s) => <circle key={item.name} cx={x(hover)} cy={y(item.values[hover] ?? 0)} r={4.5} fill={SERIES_COLOURS[s]} stroke="var(--c-panel)" strokeWidth={2} />)}</g>}
      </svg>
      {hover !== null && <Tooltip x={x(hover)} label={labels[hover] ?? ""} rows={series.map((item, s) => ({ name: item.name, value: item.values[hover] ?? 0, colour: SERIES_COLOURS[s]! }))} format={format} />}
    </div>
  </Frame>;
}

/** Ranked horizontal bars, one colour (e.g. top pages). Values sit at the bar tip. */
export function RankedBars({ title, subtitle, items, format: formatId, empty = "Nothing yet." }: { title: string; subtitle?: string; items: { label: string; value: number }[]; format: FormatId; empty?: string }) {
  const format = FORMATS[formatId];
  const max = Math.max(...items.map((item) => item.value), 1);
  return <figure className="rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] p-5">
    <figcaption className="mb-3"><p className="text-[14px] font-medium text-[var(--c-text)]">{title}</p>{subtitle && <p className="mt-0.5 text-[12px] text-[var(--c-muted)]">{subtitle}</p>}</figcaption>
    {items.length === 0 ? <p className="py-6 text-[13px] text-[var(--c-muted)]">{empty}</p>
      : <ul className="space-y-2.5">{items.map((item) => <li key={item.label} title={`${item.label}: ${format(item.value)}`} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-center gap-3 text-[12.5px]">
        <span className="truncate text-[var(--c-text2)]">{item.label}</span>
        <span className="h-3 rounded-r-[4px] bg-[var(--c-grid)]"><span className="block h-3 rounded-r-[4px]" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: SERIES_COLOURS[0] }} /></span>
        <span className="text-right tabular-nums text-[var(--c-text)]">{format(item.value)}</span>
      </li>)}</ul>}
  </figure>;
}
