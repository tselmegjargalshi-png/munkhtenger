"use client";
import { useState } from "react";
import { formatMNTShort } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export function BarChart({ data, height = 160, money, color = "#1E3A5F", testid }: { data: { label: string; value: number }[]; height?: number; money?: boolean; color?: string; testid?: string }) {
  const { lang } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 600, pad = 22;
  const bw = (W - pad * 2) / data.length;
  return (
    <div className="relative" data-testid={testid}>
      <svg viewBox={`0 0 ${W} ${height + 26}`} className="w-full" role="img">
        {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={pad} x2={W - pad} y1={height - height * t + 4} y2={height - height * t + 4} stroke="#E8E3D8" strokeWidth="1" />)}
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 8);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad + i * bw + bw * 0.18} y={height - h + 4} width={bw * 0.64} height={Math.max(h, 1)} rx="3" fill={hover === i ? "#A9814A" : color} opacity={hover === null || hover === i ? 1 : 0.6} />
              {(data.length <= 12 || i % Math.ceil(data.length / 8) === 0) && <text x={pad + i * bw + bw / 2} y={height + 20} textAnchor="middle" fontSize="11" fill="#8C93A0">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && <div className="pointer-events-none absolute right-2 top-0 rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white">{data[hover].label}: {money ? formatMNTShort(data[hover].value, lang) : data[hover].value.toLocaleString("en-US")}</div>}
    </div>
  );
}

export function LineChart({ series, labels, height = 160 }: { series: { name: string; color: string; values: number[] }[]; labels: string[]; height?: number }) {
  const W = 600, pad = 22;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => pad + (i / Math.max(1, labels.length - 1)) * (W - pad * 2);
  const y = (v: number) => height - (v / max) * (height - 10) + 4;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height + 26}`} className="w-full" role="img">
        {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={pad} x2={W - pad} y1={height - height * t + 4} y2={height - height * t + 4} stroke="#E8E3D8" />)}
        {series.map((s) => <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />)}
        {labels.map((l, i) => (i % Math.ceil(labels.length / 6) === 0 ? <text key={i} x={x(i)} y={height + 20} textAnchor="middle" fontSize="11" fill="#8C93A0">{l.slice(5)}</text> : null))}
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-ink-3">{series.map((s) => <span key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span>)}</div>
    </div>
  );
}
