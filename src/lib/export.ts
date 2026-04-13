import { supabase } from "@/lib/supabase";

function mapJourney(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPhase1(row: Record<string, unknown>) {
  return {
    completedAt: row.completed_at,
    swemwbs: row.swemwbs,
    innerLandscapeText: row.inner_landscape_text,
    innerLandscapeRatings: row.inner_landscape_ratings,
    intentions: row.intentions,
    context: row.context,
  };
}

function mapPhase2(row: Record<string, unknown>) {
  return {
    completedAt: row.completed_at,
    rawImpressions: row.raw_impressions,
    meq30: row.meq30,
    edi: row.edi,
    ebi: row.ebi,
    challenging: row.challenging,
    intentionRevisited: row.intention_revisited,
  };
}

function mapPhase3Entry(row: Record<string, unknown>) {
  return {
    label: row.label,
    completedAt: row.completed_at,
    swemwbs: row.swemwbs,
    innerLandscapeText: row.inner_landscape_text,
    innerLandscapeRatings: row.inner_landscape_ratings,
    engagedIntegration: row.engaged_integration,
    experiencedIntegration: row.experienced_integration,
    intentionIntegration: row.intention_integration,
    openReflection: row.open_reflection,
    createdAt: row.created_at,
  };
}

export async function exportJourneyAsJson(journeyId: string): Promise<void> {
  const { data, error } = await supabase
    .from("journeys")
    .select("*, phase1(*), phase2(*), phase3_entries(*)")
    .eq("id", journeyId)
    .single();

  if (error) throw error;

  const exported = {
    version: 1,
    exportedAt: new Date().toISOString(),
    journey: {
      ...mapJourney(data),
      phase1: data.phase1?.[0] ? mapPhase1(data.phase1[0]) : null,
      phase2: data.phase2?.[0] ? mapPhase2(data.phase2[0]) : null,
      phase3Entries: (data.phase3_entries ?? []).map(mapPhase3Entry),
    },
  };

  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ctrnom-${exported.journey.name?.toString().replace(/\s+/g, "-").toLowerCase() ?? "journey"}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

type ImportedJourney = {
  version: number;
  journey: {
    name: string;
    phase1: Record<string, unknown> | null;
    phase2: Record<string, unknown> | null;
    phase3Entries: Record<string, unknown>[];
  };
};

export async function importJourneyFromJson(file: File): Promise<string> {
  const text = await file.text();
  const parsed: ImportedJourney = JSON.parse(text);

  if (!parsed.version || !parsed.journey?.name) {
    throw new Error("Invalid export file format");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: journey, error: jErr } = await supabase
    .from("journeys")
    .insert({
      user_id: user.id,
      name: parsed.journey.name,
      schema_version: parsed.version,
    })
    .select()
    .single();

  if (jErr) throw jErr;

  const p1 = parsed.journey.phase1;
  if (p1) {
    const { error } = await supabase.from("phase1").insert({
      journey_id: journey.id,
      completed_at: p1.completedAt ?? null,
      swemwbs: p1.swemwbs ?? {},
      inner_landscape_text: p1.innerLandscapeText ?? {},
      inner_landscape_ratings: p1.innerLandscapeRatings ?? {},
      intentions: p1.intentions ?? {},
      context: p1.context ?? {},
    });
    if (error) throw error;
  } else {
    await supabase.from("phase1").insert({ journey_id: journey.id });
  }

  const p2 = parsed.journey.phase2;
  if (p2) {
    const { error } = await supabase.from("phase2").insert({
      journey_id: journey.id,
      completed_at: p2.completedAt ?? null,
      raw_impressions: p2.rawImpressions ?? {},
      meq30: p2.meq30 ?? {},
      edi: p2.edi ?? {},
      ebi: p2.ebi ?? {},
      challenging: p2.challenging ?? {},
      intention_revisited: p2.intentionRevisited ?? {},
    });
    if (error) throw error;
  } else {
    await supabase.from("phase2").insert({ journey_id: journey.id });
  }

  for (const entry of parsed.journey.phase3Entries ?? []) {
    const { error } = await supabase.from("phase3_entries").insert({
      journey_id: journey.id,
      label: entry.label ?? "",
      completed_at: entry.completedAt ?? null,
      swemwbs: entry.swemwbs ?? {},
      inner_landscape_text: entry.innerLandscapeText ?? {},
      inner_landscape_ratings: entry.innerLandscapeRatings ?? {},
      engaged_integration: entry.engagedIntegration ?? {},
      experienced_integration: entry.experiencedIntegration ?? {},
      intention_integration: entry.intentionIntegration ?? {},
      open_reflection: entry.openReflection ?? {},
    });
    if (error) throw error;
  }

  return journey.id as string;
}
