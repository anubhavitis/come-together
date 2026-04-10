import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useJourney } from "@/hooks";
import { exportJourneyAsJson } from "@/lib/export";
import type { FullJourney, Phase3Entry } from "@/types/journey";

export const Route = createFileRoute("/journey/$id/")({
  component: JourneyOverview,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PhaseBox({
  label,
  completedAt,
  linkTo,
  linkParams,
}: {
  label: string;
  completedAt: string | null;
  linkTo: string;
  linkParams: Record<string, string>;
}) {
  return (
    <div className="flex-1 rounded-[20px] border border-border bg-surface p-4">
      <h3 className="text-sm font-medium text-text-primary">{label}</h3>
      <p className="mt-1 text-xs text-text-secondary">
        {completedAt ? (
          <span className="text-success">
            Completed {formatDate(completedAt)}
          </span>
        ) : (
          "Not started"
        )}
      </p>
      <Link
        to={linkTo}
        params={linkParams}
        className="mt-3 inline-block text-xs font-medium text-text-secondary hover:text-accent-warm"
      >
        {completedAt ? "Review" : "Begin"} →
      </Link>
    </div>
  );
}

function Phase3Section({ journey }: { journey: FullJourney }) {
  return (
    <div className="rounded-[20px] border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          Phase 3 — Integration Check-ins
          <span className="ml-2 text-xs text-text-secondary">
            ({journey.phase3Entries.length}{" "}
            {journey.phase3Entries.length === 1 ? "entry" : "entries"})
          </span>
        </h3>
        <Link
          to="/journey/$id/phase3/new"
          params={{ id: journey.id }}
          className="rounded-[16px] bg-accent-warm px-3 py-1 text-xs font-medium text-background"
        >
          New Check-in
        </Link>
      </div>

      {journey.phase3Entries.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {journey.phase3Entries.map((entry: Phase3Entry) => (
            <li key={entry.id}>
              <Link
                to="/journey/$id/phase3/$entryId"
                params={{ id: journey.id, entryId: entry.id }}
                className="flex items-center justify-between rounded-[16px] bg-card px-3 py-2 text-sm hover:bg-background"
              >
                <span className="text-text-primary">{entry.label}</span>
                <span className="text-xs text-text-secondary">
                  {entry.completedAt ? (
                    <span className="text-success">
                      {formatDate(entry.completedAt)}
                    </span>
                  ) : (
                    "In progress"
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-text-secondary">
          No check-ins yet. Start one after your experience to track
          integration.
        </p>
      )}
    </div>
  );
}

function JourneyOverview() {
  const { id } = Route.useParams();
  const { data: journey, isLoading, error } = useJourney(id);

  if (isLoading) return <p className="text-text-secondary">Loading...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
  if (!journey) return null;

  return (
    <div>
      <Link
        to="/"
        className="text-xs text-text-secondary hover:text-text-primary"
      >
        ← Back to journeys
      </Link>

      <h1 className="mt-3 text-2xl font-bold">{journey.name}</h1>
      <p className="mt-1 text-xs text-text-secondary">
        Created {formatDate(journey.createdAt)}
      </p>

      {/* Phase timeline */}
      <div className="mt-6 flex items-center gap-2">
        <PhaseBox
          label="Phase 1 — Preparation"
          completedAt={journey.phase1?.completedAt ?? null}
          linkTo="/journey/$id/phase1"
          linkParams={{ id: journey.id }}
        />
        <span className="text-text-secondary">→</span>
        <PhaseBox
          label="Phase 2 — Experience"
          completedAt={journey.phase2?.completedAt ?? null}
          linkTo="/journey/$id/phase2"
          linkParams={{ id: journey.id }}
        />
        <span className="text-text-secondary">→</span>
        <div className="flex-1">
          <Phase3Section journey={journey} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-4">
        <Link
          to="/journey/$id/compare"
          params={{ id: journey.id }}
          className="text-sm text-text-secondary hover:text-accent-warm"
        >
          View comparison →
        </Link>
        <ExportButton journeyId={journey.id} />
      </div>
    </div>
  );
}

function ExportButton({ journeyId }: { journeyId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportJourneyAsJson(journeyId);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
    >
      {exporting ? "Exporting..." : "Export JSON"}
    </button>
  );
}
