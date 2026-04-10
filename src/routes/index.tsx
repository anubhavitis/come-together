import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJourneys, useCreateJourney, useDeleteJourney } from "@/hooks";
import { importJourneyFromJson } from "@/lib/export";
import type { Journey } from "@/types/journey";

export const Route = createFileRoute("/")({
  component: JourneyList,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CreateJourneyForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const createJourney = useCreateJourney();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[16px] bg-accent-warm px-4 py-2 text-sm font-medium text-background"
      >
        New Journey
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
        placeholder="Journey name"
        className="rounded-[16px] border border-border bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-focus"
      />
      <button
        type="submit"
        disabled={!name.trim() || createJourney.isPending}
        className="rounded-[16px] bg-accent-warm px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {createJourney.isPending ? "Creating..." : "Create"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        className="rounded-[16px] px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
      >
        Cancel
      </button>
    </form>
  );
}

function DeleteButton({ journey }: { journey: Journey }) {
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
        className="text-xs text-text-secondary hover:text-danger"
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
        className="w-44 rounded-[16px] border border-border bg-card px-2 py-1 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-danger"
      />
      <button
        disabled={input !== "delete" || deleteJourney.isPending}
        onClick={() => deleteJourney.mutateAsync(journey.id)}
        className="rounded-[16px] bg-danger px-2 py-1 text-xs font-medium text-background disabled:opacity-50"
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

function JourneyCard({ journey }: { journey: Journey }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate({ to: "/journey/$id", params: { id: journey.id } })
      }
      className="cursor-pointer rounded-[20px] border border-border bg-surface p-4 transition-colors hover:bg-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-text-primary">{journey.name}</h3>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDate(journey.createdAt)}
          </p>
        </div>
        <DeleteButton journey={journey} />
      </div>
    </div>
  );
}

function ImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const journeyId = await importJourneyFromJson(file);
      await queryClient.invalidateQueries({ queryKey: ["journeys"] });
      navigate({ to: "/journey/$id", params: { id: journeyId } });
    } catch (err) {
      alert(
        `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="rounded-[16px] border border-border px-3 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
      >
        {importing ? "Importing..." : "Import"}
      </button>
    </>
  );
}

function JourneyList() {
  const { data: journeys, isLoading, error } = useJourneys();

  if (isLoading) return <p className="text-text-secondary">Loading...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Journeys</h1>
        <div className="flex items-center gap-2">
          <ImportButton />
          <CreateJourneyForm />
        </div>
      </div>

      {journeys && journeys.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          {journeys.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-accent-warm">No journeys yet</p>
          <p className="mt-2 text-sm text-text-secondary">
            Every great voyage begins with a single step. Create your first
            journey to start exploring your inner landscape.
          </p>
        </div>
      )}
    </div>
  );
}
