"use client";
import { useEffect } from "react";
import { runMaintenance } from "@/lib/actions";
import { getState } from "@/lib/store";

/** Runs expiry checks once per page load. */
export function Boot() {
  useEffect(() => {
    if (getState().db) runMaintenance();
  }, []);
  return null;
}
