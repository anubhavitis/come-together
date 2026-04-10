CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- journeys
CREATE TABLE journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  schema_version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_journeys_user_id ON journeys(user_id);
CREATE INDEX idx_journeys_updated_at ON journeys(updated_at);

CREATE TRIGGER trg_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY journeys_select ON journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY journeys_insert ON journeys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY journeys_update ON journeys FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY journeys_delete ON journeys FOR DELETE USING (auth.uid() = user_id);

-- phase1
CREATE TABLE phase1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL UNIQUE REFERENCES journeys(id) ON DELETE CASCADE,
  completed_at timestamptz,
  swemwbs jsonb DEFAULT '{}',
  inner_landscape_text jsonb DEFAULT '{}',
  inner_landscape_ratings jsonb DEFAULT '{}',
  intentions jsonb DEFAULT '{}',
  context jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_phase1_journey_id ON phase1(journey_id);

CREATE TRIGGER trg_phase1_updated_at
  BEFORE UPDATE ON phase1
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE phase1 ENABLE ROW LEVEL SECURITY;

CREATE POLICY phase1_select ON phase1 FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase1_insert ON phase1 FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase1_update ON phase1 FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase1_delete ON phase1 FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));

-- phase2
CREATE TABLE phase2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL UNIQUE REFERENCES journeys(id) ON DELETE CASCADE,
  completed_at timestamptz,
  raw_impressions jsonb DEFAULT '{}',
  meq30 jsonb DEFAULT '{}',
  edi jsonb DEFAULT '{}',
  ebi jsonb DEFAULT '{}',
  challenging jsonb DEFAULT '{}',
  intention_revisited jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_phase2_journey_id ON phase2(journey_id);

CREATE TRIGGER trg_phase2_updated_at
  BEFORE UPDATE ON phase2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE phase2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY phase2_select ON phase2 FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase2_insert ON phase2 FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase2_update ON phase2 FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase2_delete ON phase2 FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));

-- phase3_entries
CREATE TABLE phase3_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  completed_at timestamptz,
  swemwbs jsonb DEFAULT '{}',
  inner_landscape_text jsonb DEFAULT '{}',
  inner_landscape_ratings jsonb DEFAULT '{}',
  engaged_integration jsonb DEFAULT '{}',
  experienced_integration jsonb DEFAULT '{}',
  intention_integration jsonb DEFAULT '{}',
  open_reflection jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_phase3_entries_journey_id ON phase3_entries(journey_id);
CREATE INDEX idx_phase3_entries_updated_at ON phase3_entries(updated_at);

CREATE TRIGGER trg_phase3_entries_updated_at
  BEFORE UPDATE ON phase3_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE phase3_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY phase3_entries_select ON phase3_entries FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase3_entries_insert ON phase3_entries FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase3_entries_update ON phase3_entries FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
CREATE POLICY phase3_entries_delete ON phase3_entries FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM journeys WHERE id = journey_id));
