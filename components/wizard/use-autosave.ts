"use client";

import { useEffect, useRef, useState } from "react";
import type { WizardState } from "./types";

const STORAGE_KEY = "stitchos.wizard.draft";
const DEBOUNCE_MS = 1200;

/**
 * Persists the lightweight, serializable parts of wizard state (never the
 * raster buffers — those are tens of MB each and not worth round-tripping
 * through localStorage) so a name, size, color targets, and product
 * selections survive an accidental tab close. This is metadata recovery,
 * not full session restore: artwork must still be re-imported.
 */
function serializableSlice(state: WizardState) {
  return {
    designName: state.designName,
    clientId: state.clientId,
    widthInches: state.widthInches,
    heightInches: state.heightInches,
    displayUnit: state.displayUnit,
    targetColorCount: state.targetColorCount,
    productId: state.productId,
    locationId: state.locationId,
    setupId: state.setupId,
    machineId: state.machineId,
  };
}

export function useAutosave(state: WizardState) {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state.designName) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ savedAt: new Date().toISOString(), draft: serializableSlice(state) })
        );
        setLastSavedAt(new Date());
      } catch {
        // localStorage unavailable (private browsing, quota) — autosave is best-effort.
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.designName,
    state.clientId,
    state.widthInches,
    state.heightInches,
    state.displayUnit,
    state.targetColorCount,
    state.productId,
    state.locationId,
    state.setupId,
    state.machineId,
  ]);

  return { lastSavedAt };
}

export function clearAutosaveDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}
