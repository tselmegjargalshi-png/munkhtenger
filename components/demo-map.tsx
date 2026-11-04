"use client";
import { MousePointer2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { formatMNTShort, cx } from "@/lib/format";
import { MAP_BOUNDS } from "@/lib/geo";
import type { DistrictConfig, Property } from "@/lib/types";

const W = 1000;
const H = 680;
const proj = (lat: number, lng: number) => ({
  x: ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * W,
  y: ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * H,
});
const unproj = (x: number, y: number) => ({
  lng: MAP_BOUNDS.minLng + (x / W) * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng),
  lat: MAP_BOUNDS.maxLat - (y / H) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat),
});

/**
 * DEMO MAP. A schematic of central Ulaanbaatar drawn from district centre coordinates.
 * It is not a live map provider and its geometry is approximate. See README for plugging in Mapbox or Leaflet.
 */
export function DemoMap({
  properties,
  districts,
  selectedId,
  onSelect,
  bbox,
  onBbox,
  district,
  onDistrict,
  height = 560,
}: {
  properties: Property[];
  districts: DistrictConfig[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  bbox: [number, number, number, number] | null;
  onBbox: (b: [number, number, number, number] | null) => void;
  district?: string;
  onDistrict?: (key: string) => void;
  height?: number;
}) {
  const { lang, tr } = useLang();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const pts = useMemo(
    () => properties.map((p) => ({ p, ...proj(p.lat, p.lng) })).filter((m) => m.x > -20 && m.x < W + 20 && m.y > -20 && m.y < H + 20),
    [properties],
  );

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const bboxRect = bbox
    ? (() => {
        const a = proj(bbox[2], bbox[1]);
        const b = proj(bbox[0], bbox[3]);
        return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
      })()
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-paper-3 bg-[#EEF1EC]" data-testid="demo-map">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white" data-testid="demo-map-label">
          {tr("ДЕМО ГАЗРЫН ЗУРАГ · схем зураг, бодит газрын зураг биш", "DEMO MAP · schematic, not a live map")}
        </span>
        <button
          type="button"
          data-testid="map-draw"
          onClick={() => {
            setDrawMode((d) => !d);
            setDrag(null);
          }}
          className={cx("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-card", drawMode ? "border-sky bg-sky text-white" : "border-paper-3 bg-white text-ink-2")}
        >
          <MousePointer2 size={13} /> {drawMode ? tr("Талбайг чирж сонгоно уу", "Drag to select an area") : tr("Талбай сонгох", "Select area")}
        </button>
        {bbox && (
          <button type="button" data-testid="map-clear-area" onClick={() => onBbox(null)} className="flex items-center gap-1 rounded-full border border-paper-3 bg-white px-3 py-1 text-xs font-semibold text-rust shadow-card">
            <X size={12} /> {tr("Талбай арилгах", "Clear area")}
          </button>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={cx("block w-full touch-none select-none", drawMode && "cursor-crosshair")}
        style={{ height }}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={tr("Улаанбаатарын демо газрын зураг", "Demo map of Ulaanbaatar")}
        onPointerDown={(e) => {
          if (!drawMode) return;
          const { x, y } = toLocal(e);
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          setDrag({ x0: x, y0: y, x1: x, y1: y });
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          const { x, y } = toLocal(e);
          setDrag({ ...drag, x1: x, y1: y });
        }}
        onPointerUp={() => {
          if (!drag) return;
          const w = Math.abs(drag.x1 - drag.x0);
          const h = Math.abs(drag.y1 - drag.y0);
          if (w > 14 && h > 14) {
            const a = unproj(Math.min(drag.x0, drag.x1), Math.max(drag.y0, drag.y1));
            const b = unproj(Math.max(drag.x0, drag.x1), Math.min(drag.y0, drag.y1));
            onBbox([+a.lat.toFixed(5), +a.lng.toFixed(5), +b.lat.toFixed(5), +b.lng.toFixed(5)]);
            setDrawMode(false);
          }
          setDrag(null);
        }}
        onClick={() => !drawMode && onSelect(null)}
      >
        <defs>
          <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0 V9" stroke="#C9D2C3" strokeWidth="2" />
          </pattern>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0 H0 V50" fill="none" stroke="#E1E6DC" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="#EEF1EC" />
        <rect width={W} height={H} fill="url(#grid)" />
        {/* Bogd Khan mountain (south) and northern hills */}
        <path d={`M0 ${H} L0 ${H * 0.9} Q${W * 0.2} ${H * 0.78} ${W * 0.4} ${H * 0.86} T${W * 0.8} ${H * 0.82} T${W} ${H * 0.88} V${H} Z`} fill="url(#hatch)" />
        <path d={`M0 0 H${W} V${H * 0.1} Q${W * 0.7} ${H * 0.04} ${W * 0.45} ${H * 0.09} T0 ${H * 0.07} Z`} fill="url(#hatch)" />
        <text x={W * 0.52} y={H * 0.955} fontSize="15" fill="#8A967F" textAnchor="middle" letterSpacing="4">{tr("БОГД ХАН УУЛ", "BOGD KHAN MOUNTAIN")}</text>
        {/* Tuul river */}
        <path d={`M-10 ${H * 0.74} C${W * 0.2} ${H * 0.62} ${W * 0.35} ${H * 0.78} ${W * 0.55} ${H * 0.7} S${W * 0.85} ${H * 0.6} ${W + 10} ${H * 0.66}`} fill="none" stroke="#BFD5E6" strokeWidth="14" strokeLinecap="round" />
        <text x={W * 0.12} y={H * 0.66} fontSize="12" fill="#6E8FA8" fontStyle="italic">{tr("Туул гол", "Tuul River")}</text>
        {/* Peace avenue */}
        <path d={`M0 ${H * 0.5} C${W * 0.3} ${H * 0.48} ${W * 0.6} ${H * 0.52} ${W} ${H * 0.47}`} fill="none" stroke="#D9D4C6" strokeWidth="9" strokeLinecap="round" />
        <path d={`M0 ${H * 0.5} C${W * 0.3} ${H * 0.48} ${W * 0.6} ${H * 0.52} ${W} ${H * 0.47}`} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="10 10" />
        {/* districts */}
        {districts
          .filter((d) => d.enabled)
          .map((d) => {
            const c = proj(d.lat, d.lng);
            if (c.x < 0 || c.x > W || c.y < 0 || c.y > H) return null;
            const on = district === d.key;
            return (
              <g key={d.key} onClick={(e) => { e.stopPropagation(); if (!drawMode) onDistrict?.(on ? "" : d.key); }} className={onDistrict ? "cursor-pointer" : ""}>
                <circle cx={c.x} cy={c.y} r={on ? 110 : 96} fill={on ? "#1E3A5F" : "#A9814A"} opacity={on ? 0.14 : 0.07} />
                <circle cx={c.x} cy={c.y} r={on ? 110 : 96} fill="none" stroke={on ? "#1E3A5F" : "#A9814A"} strokeWidth="1.5" strokeDasharray="5 6" opacity=".55" />
                <text x={c.x} y={c.y + 118} textAnchor="middle" fontSize="15" fontWeight="700" fill={on ? "#1E3A5F" : "#7C5B2B"} letterSpacing=".5">{d.name[lang]}</text>
              </g>
            );
          })}
        {bboxRect && <rect x={bboxRect.x} y={bboxRect.y} width={bboxRect.w} height={bboxRect.h} fill="#1E3A5F" fillOpacity=".08" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="8 5" />}
        {drag && <rect x={Math.min(drag.x0, drag.x1)} y={Math.min(drag.y0, drag.y1)} width={Math.abs(drag.x1 - drag.x0)} height={Math.abs(drag.y1 - drag.y0)} fill="#1E3A5F" fillOpacity=".12" stroke="#1E3A5F" strokeWidth="2" />}
        {/* markers */}
        {pts
          .slice()
          .sort((a, b) => (a.p.id === selectedId ? 1 : 0) - (b.p.id === selectedId ? 1 : 0))
          .map(({ p, x, y }) => {
            const label = formatMNTShort(p.price, lang).replace(" ₮", "").replace("₮", "");
            const w = Math.max(54, label.length * 8 + 18);
            const sel = p.id === selectedId;
            return (
              <g
                key={p.id}
                data-testid="map-marker"
                tabIndex={0}
                role="button"
                aria-label={`${label} ₮`}
                transform={`translate(${x} ${y})`}
                className="cursor-pointer outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!drawMode) onSelect(p.id);
                }}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(p.id)}
                onPointerDown={(e) => !drawMode && e.stopPropagation()}
              >
                <path d={`M${-w / 2} -30 h${w} a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h${-(w / 2 - 8)} l-8 9 l-8 -9 h${-(w / 2 - 8)} a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8z`} transform={`translate(0 0)`} fill={sel ? "#A9814A" : p.promotion === "premium" ? "#15181E" : "#1E3A5F"} stroke="#fff" strokeWidth="2.5" style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.25))" }} />
                <text y="-12" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{label}</text>
              </g>
            );
          })}
      </svg>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] text-ink-3 shadow-card">
        {tr("Маркер дээр дарж зарыг үзнэ үү", "Click a marker to preview")} · {pts.length} {tr("зар", "listings")}
      </div>
    </div>
  );
}
