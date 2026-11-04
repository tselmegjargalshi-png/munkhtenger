import { cx } from "@/lib/format";

/** Munkhtenger mark: an eternal sky arch over a roofline. */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#1E3A5F" />
      <circle cx="20" cy="15" r="5.2" fill="#C9A46B" />
      <path d="M7 31 L20 20.5 L33 31" stroke="#FAF8F4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 31 V27.5 M27.5 31 V27.5" stroke="#FAF8F4" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function Logo({ lang, light, className }: { lang: "mn" | "en"; light?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className={cx("block font-display text-[22px] font-bold tracking-tight", light ? "text-white" : "text-ink")}>{lang === "mn" ? "Мөнхтэнгэр" : "Munkhtenger"}</span>
        <span className={cx("mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em]", light ? "text-white/60" : "text-brass")}>{lang === "mn" ? "Үл хөдлөх хөрөнгө" : "Real Estate"}</span>
      </span>
    </span>
  );
}
