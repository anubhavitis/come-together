import { useState, useEffect, useRef, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutoSaveOptions<T> = {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
};

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 500,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const dataRef = useRef(data);
  const onSaveRef = useRef(onSave);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);
  const initialRender = useRef(true);

  dataRef.current = data;
  onSaveRef.current = onSave;

  const save = useCallback(async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    setStatus("saving");
    try {
      await onSaveRef.current(dataRef.current);
      setStatus("saved");
      savedTimer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    } finally {
      isSaving.current = false;
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (savedTimer.current) {
      clearTimeout(savedTimer.current);
      savedTimer.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    clearTimers();
    await save();
  }, [clearTimers, save]);

  // Debounce on data change
  useEffect(() => {
    if (!enabled) return;
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);

    debounceTimer.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data, enabled, debounceMs, save]);

  // Flush on visibility change and beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden && debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
        save();
      }
    };

    const handleBeforeUnload = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
        // Best-effort sync save via sendBeacon or sync XHR not feasible here;
        // fire the async save and hope it completes
        save();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, save]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return { status, flush };
}
