import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useJourneys,
  useJourney,
  useCreateJourney,
  useDeleteJourney,
} from "@/hooks";
import type { Journey } from "@/types/journey";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CreateSessionForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const createJourney = useCreateJourney();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[16px] bg-accent-warm px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-warm/90"
      >
        New Session
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const journey = await createJourney.mutateAsync(name.trim());
    setName("");
    setOpen(false);
    navigate({ to: "/journey/$id/phase1", params: { id: journey.id } });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Session name"
        className="rounded-[12px] border border-surface bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-warm"
      />
      <button
        type="submit"
        disabled={!name.trim() || createJourney.isPending}
        className="rounded-[12px] bg-accent-warm px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {createJourney.isPending ? "Creating..." : "Create"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        className="rounded px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
      >
        Cancel
      </button>
    </form>
  );
}

function DeleteSessionButton({ journey }: { journey: Journey }) {
  const [confirming, setConfirming] = useState(false);
  const [input, setInput] = useState("");
  const deleteJourney = useDeleteJourney();

  if (!confirming) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        className="text-xs text-text-secondary hover:text-danger transition-colors"
      >
        Delete
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type 'delete' to confirm"
        className="w-44 rounded border border-surface bg-card px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-danger"
      />
      <button
        disabled={input !== "delete" || deleteJourney.isPending}
        onClick={() => deleteJourney.mutateAsync(journey.id)}
        className="rounded bg-danger px-2 py-1 text-xs font-medium text-background disabled:opacity-50"
      >
        {deleteJourney.isPending ? "..." : "Delete"}
      </button>
      <button
        onClick={() => {
          setConfirming(false);
          setInput("");
        }}
        className="text-xs text-text-secondary hover:text-text-primary"
      >
        Cancel
      </button>
    </div>
  );
}

function PhaseIndicator({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full text-[10px] font-medium w-7 h-7",
        completed
          ? "bg-success/20 text-success border border-success/40"
          : "bg-transparent text-text-secondary border border-text-secondary/30",
      ].join(" ")}
      title={`${label} ${completed ? "completed" : "not started"}`}
    >
      {label}
    </span>
  );
}

function SessionCard({ journey }: { journey: Journey }) {
  const { data: fullJourney } = useJourney(journey.id);

  const phase1Done = fullJourney?.phase1?.completedAt != null;
  const phase2Done = fullJourney?.phase2?.completedAt != null;
  const phase3Done =
    fullJourney?.phase3Entries?.some((e) => e.completedAt != null) ?? false;

  return (
    <div className="rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-card/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">
            {journey.name}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDate(journey.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PhaseIndicator label="CT" completed={phase1Done} />
          <PhaseIndicator label="RN" completed={phase2Done} />
          <PhaseIndicator label="OM" completed={phase3Done} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Link
          to="/journey/$id/compare"
          params={{ id: journey.id }}
          className="text-sm text-text-secondary hover:text-accent-warm transition-colors"
        >
          View Summary &rarr;
        </Link>
        <DeleteSessionButton journey={journey} />
      </div>
    </div>
  );
}

function ProfilePage() {
  const { data: journeys, isLoading, error } = useJourneys();

  if (isLoading) {
    return <p className="text-text-secondary">Loading sessions...</p>;
  }

  if (error) {
    return <p className="text-danger">Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Your Sessions
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your journey sessions
          </p>
        </div>
        <CreateSessionForm />
      </div>

      {journeys && journeys.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          {journeys.map((j) => (
            <SessionCard key={j.id} journey={j} />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-accent-warm">No sessions yet</p>
          <p className="mt-2 text-sm text-text-secondary">
            Start your first journey to begin exploring.
          </p>
        </div>
      )}
    </div>
  );
}
