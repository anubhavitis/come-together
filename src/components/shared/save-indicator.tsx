import type { AutoSaveStatus } from "../../hooks/use-auto-save";

export function SaveIndicator({ status }: { status: AutoSaveStatus }) {
  if (status === "idle") return null;

  if (status === "saving") {
    return <span className="text-sm text-text-secondary animate-pulse">Saving...</span>;
  }

  if (status === "saved") {
    return <span className="text-sm text-success">Saved</span>;
  }

  return <span className="text-sm text-danger">Save failed</span>;
}
