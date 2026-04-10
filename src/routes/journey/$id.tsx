import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useJourney } from "@/hooks";

export const Route = createFileRoute("/journey/$id")({
  component: JourneyLayout,
});

const PHASES = [
  { label: "Come Together", path: "phase1", key: "phase1" as const },
  { label: "Right Now", path: "phase2", key: "phase2" as const },
  { label: "Over Me", path: "phase3/new", key: "phase3" as const },
] as const;

function JourneyLayout() {
  const { id } = Route.useParams();
  const location = useLocation();
  const { data: journey } = useJourney(id);

  const completionStatus = {
    phase1: journey?.phase1?.completedAt != null,
    phase2: journey?.phase2?.completedAt != null,
    phase3: journey?.phase3Entries?.some((e) => e.completedAt != null) ?? false,
  };

  function getCurrentPhase(): string | null {
    const path = location.pathname;
    if (path.includes("phase1")) return "phase1";
    if (path.includes("phase2")) return "phase2";
    if (path.includes("phase3")) return "phase3";
    return null;
  }

  const currentPhase = getCurrentPhase();

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-text-secondary hover:text-accent-warm transition-colors"
      >
        &larr; Back to journeys
      </Link>

      <nav className="flex items-center justify-center gap-2 border-b border-border py-4 mb-6">
        {PHASES.map((phase, i) => {
          const isActive = currentPhase === phase.key;
          const isCompleted = completionStatus[phase.key];

          return (
            <div key={phase.key} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-text-secondary/30 text-sm select-none">
                  &rarr;
                </span>
              )}
              <Link
                to={`/journey/$id/${phase.path}`}
                params={{ id }}
                className={[
                  "px-3 py-2 text-sm rounded-[16px] transition-colors hover:bg-surface",
                  isActive
                    ? "text-accent-warm font-semibold border-b-2 border-accent-warm"
                    : isCompleted
                      ? "text-success"
                      : "text-text-secondary",
                ].join(" ")}
              >
                {isCompleted && !isActive && (
                  <span className="mr-1">&check;</span>
                )}
                {phase.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
