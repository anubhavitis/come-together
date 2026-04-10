import { createFileRoute, Link } from "@tanstack/react-router";
import { useJourney } from "@/hooks/use-journeys";
import {
  computeMeq30Subscales,
  computeSwemwbsTotal,
  computeEdiMean,
  computeEbiSum,
} from "@/lib/scoring";
import { Meq30Radar } from "@/components/charts/meq30-radar";
import { SwemwbsBar } from "@/components/charts/swemwbs-bar";
import { EdiGauge } from "@/components/charts/edi-gauge";
import { EbiGauge } from "@/components/charts/ebi-gauge";

export const Route = createFileRoute("/journey/$id/compare")({
  component: ComparisonView,
});

const COMPLETE_MYSTICAL_THRESHOLD = 3.0;

function ComparisonView() {
  const { id } = Route.useParams();
  const { data: journey, isLoading, error } = useJourney(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-text-secondary">Loading comparison data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-danger">Error: {error.message}</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-text-secondary">Journey not found.</p>
      </div>
    );
  }

  const latestPhase3 =
    journey.phase3Entries
      .filter((e) => e.completedAt)
      .slice(-1)[0] ?? null;

  const hasPhase2 = journey.phase2 !== null;

  const subscales = hasPhase2
    ? computeMeq30Subscales(journey.phase2!.meq30)
    : null;

  const swemwbsBefore = journey.phase1
    ? computeSwemwbsTotal(journey.phase1.swemwbs)
    : null;

  const swemwbsAfter = latestPhase3
    ? computeSwemwbsTotal(latestPhase3.swemwbs)
    : null;

  const ediScore = hasPhase2 ? computeEdiMean(journey.phase2!.edi) : null;
  const ebiScore = hasPhase2 ? computeEbiSum(journey.phase2!.ebi) : null;

  const isCompleteMystical =
    subscales !== null &&
    subscales.mystical >= COMPLETE_MYSTICAL_THRESHOLD &&
    subscales.positiveMood >= COMPLETE_MYSTICAL_THRESHOLD &&
    subscales.transcendence >= COMPLETE_MYSTICAL_THRESHOLD &&
    subscales.ineffability >= COMPLETE_MYSTICAL_THRESHOLD;

  // tripSummary may exist on phase3 entries if the AI summary feature is wired
  const tripSummary = latestPhase3
    ? (latestPhase3 as Record<string, unknown>).tripSummary as string | undefined
    : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        to="/journey/$id"
        params={{ id }}
        className="inline-block text-sm text-text-secondary hover:text-accent-warm transition-colors"
      >
        &larr; Back to journey
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-text-primary">
        Your Journey — Before & After
      </h1>
      <p className="mt-2 text-text-secondary">
        See how your inner landscape has shifted.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column: Charts */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Instrument Scores
          </h2>

          {!hasPhase2 ? (
            <div className="rounded-[20px] bg-surface p-6">
              <p className="text-text-secondary italic">
                Complete the Right Now check-in to see your instrument scores.
              </p>
            </div>
          ) : (
            <>
              {/* MEQ-30 Radar */}
              <div className="rounded-[20px] bg-surface p-6">
                <p className="mb-4 text-sm font-medium text-text-primary">
                  MEQ-30 Mystical Experience
                </p>
                {subscales && <Meq30Radar subscales={subscales} />}
                {isCompleteMystical && (
                  <p className="mt-3 text-center text-sm font-semibold text-success">
                    Complete Mystical Experience
                  </p>
                )}
              </div>

              {/* SWEMWBS Bar */}
              {swemwbsBefore !== null && (
                <div className="rounded-[20px] bg-surface p-6">
                  <p className="mb-4 text-sm font-medium text-text-primary">
                    SWEMWBS Wellbeing
                  </p>
                  <SwemwbsBar before={swemwbsBefore} after={swemwbsAfter} />
                </div>
              )}

              {/* EDI Gauge */}
              {ediScore !== null && (
                <div className="rounded-[20px] bg-surface p-6">
                  <EdiGauge score={ediScore} />
                </div>
              )}

              {/* EBI Gauge */}
              {ebiScore !== null && (
                <div className="rounded-[20px] bg-surface p-6">
                  <EbiGauge score={ebiScore} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right column: Trip Summary */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Your Trip Summary
          </h2>

          {tripSummary ? (
            <div className="rounded-[20px] bg-surface p-6">
              <p className="whitespace-pre-wrap leading-relaxed text-text-primary">
                {tripSummary}
              </p>
            </div>
          ) : (
            <div className="rounded-[20px] bg-surface p-6">
              <p className="text-text-secondary italic">
                Complete the Over Me reflection to receive your holistic trip
                summary.
              </p>
              <Link
                to="/journey/$id/phase3/new"
                params={{ id }}
                className="mt-4 inline-block text-sm text-accent-warm hover:underline"
              >
                Start reflection &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
