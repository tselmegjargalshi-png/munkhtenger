"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { L10n, Lang } from "./types";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Inline translation helper: tr("Монгол", "English") */
  tr: (mn: string, en: string) => string;
  /** Pick from an L10n object with fallback to the other language */
  l: (v: L10n | undefined) => string;
}

const LangCtx = createContext<Ctx>({ lang: "mn", setLang: () => {}, tr: (mn) => mn, l: (v) => v?.mn ?? "" });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mn");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mt_lang");
      if (saved === "en" || saved === "mn") setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "mn" ? "mn" : "en";
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("mt_lang", l);
    } catch {}
  }, []);
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      tr: (mn, en) => (lang === "mn" ? mn : en),
      l: (v) => (v ? (lang === "mn" ? v.mn || v.en : v.en || v.mn) : ""),
    }),
    [lang, setLang],
  );
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
