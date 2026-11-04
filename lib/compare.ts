"use client";
import { useEffect, useState } from "react";

const KEY = "mt_compare";
const EVT = "mt-compare-change";

export function getCompare(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.slice(0, 4) : [];
  } catch {
    return [];
  }
}
function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new Event(EVT));
}
/** Returns "full" when the 4 property limit is hit. */
export function toggleCompare(id: string): "added" | "removed" | "full" {
  const ids = getCompare();
  if (ids.includes(id)) {
    save(ids.filter((x) => x !== id));
    return "removed";
  }
  if (ids.length >= 4) return "full";
  save([...ids, id]);
  return "added";
}
export function clearCompare() {
  save([]);
}
export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(getCompare());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}
