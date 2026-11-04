import { useSyncExternalStore } from "react";
import { DB_VERSION, seedDatabase } from "./seed";
import type { Db, User } from "./types";

/**
 * Demo mode data layer. The whole database lives in localStorage so it persists across reloads
 * and tabs. Every write goes through `mutate`, which clones, applies, validates and saves.
 * The Supabase schema in supabase/migrations mirrors these types for production use.
 */
const DB_KEY = "mt_db_v" + DB_VERSION;
const SESSION_KEY = "mt_session_v1";

export interface AppState {
  db: Db | null;
  sessionId: string | null;
  saveError: boolean;
}

let state: AppState = { db: null, sessionId: null, saveError: false };
let booted = false;
const listeners = new Set<() => void>();

export class AppError extends Error {
  mn: string;
  en: string;
  constructor(mn: string, en: string) {
    super(en);
    this.mn = mn;
    this.en = en;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function persist(db: Db): boolean {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

function boot() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  let db: Db | null = null;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) db = JSON.parse(raw) as Db;
  } catch {
    db = null;
  }
  if (!db || db.version !== DB_VERSION) {
    // drop stale versions of the demo database
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("mt_db_v") && k !== DB_KEY).forEach((k) => localStorage.removeItem(k));
    } catch {}
    db = seedDatabase();
    persist(db);
  }
  let sessionId: string | null = null;
  try {
    sessionId = localStorage.getItem(SESSION_KEY);
  } catch {}
  if (sessionId && !db.users.some((u) => u.id === sessionId && u.active)) sessionId = null;
  state = { db, sessionId, saveError: false };
  window.addEventListener("storage", (e) => {
    if (e.key === DB_KEY && e.newValue) {
      try {
        state = { ...state, db: JSON.parse(e.newValue) as Db };
        emit();
      } catch {}
    }
    if (e.key === SESSION_KEY) {
      state = { ...state, sessionId: e.newValue };
      emit();
    }
  });
}

export function getState(): AppState {
  boot();
  return state;
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useApp(): AppState & { user: User | null; ready: boolean } {
  const s = useSyncExternalStore(subscribe, getState, () => ({ db: null, sessionId: null, saveError: false }) as AppState);
  const user = s.db && s.sessionId ? (s.db.users.find((u) => u.id === s.sessionId) ?? null) : null;
  return { ...s, user, ready: !!s.db };
}

export function currentUser(): User | null {
  const s = getState();
  return s.db && s.sessionId ? (s.db.users.find((u) => u.id === s.sessionId && u.active) ?? null) : null;
}

/** Apply a change atomically. Throws AppError (or anything) to abort without saving. */
export function mutate<T>(fn: (db: Db) => T): T {
  const s = getState();
  if (!s.db) throw new AppError("Өгөгдөл ачаалагдаагүй байна", "Data is not loaded yet");
  const next = structuredClone(s.db);
  const result = fn(next);
  const ok = persist(next);
  state = { ...s, db: next, saveError: !ok };
  emit();
  return result;
}

export function setSession(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
  state = { ...getState(), sessionId: id };
  emit();
}

export function resetDemo() {
  const db = seedDatabase();
  persist(db);
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("mt_recent_guest");
    localStorage.removeItem("mt_compare");
  } catch {}
  state = { db, sessionId: null, saveError: false };
  emit();
}

export function nextId(db: Db, prefix: string) {
  db.seq += 1;
  return `${prefix}_${db.seq.toString(36)}`;
}
