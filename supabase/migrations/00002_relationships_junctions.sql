-- ============================================================================
-- 00002_relationships_junctions.sql
--
-- Relationship table (character_relationships) and 11 junction tables that
-- connect the core entities defined in 00001_initial_schema.sql (issue #14).
--
-- Per docs/system-design.md §3.4: junction tables have composite primary keys,
-- no surrogate id, and no user_id. RLS will derive ownership from parent
-- entities (issue #19).
-- ============================================================================

-- ============================================================================
-- Relationship Tables
-- ============================================================================

CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  related_character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  relationship_type VARCHAR(100) NOT NULL
    CHECK (relationship_type IN (
      'family', 'professional', 'friendship', 'rivalry',
      'owner_pet', 'trainer_trainee', 'creator_creation',
      'worship', 'collaboration', 'enemy', 'mentor_student'
    )),
  description TEXT,
  start_temporal JSONB,
  end_temporal JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CHECK (character_id != related_character_id)
);

CREATE UNIQUE INDEX char_rels_unique ON character_relationships
  (character_id, related_character_id, relationship_type);

-- ============================================================================
-- Junction Tables
-- ============================================================================

-- Events ↔ Categories
CREATE TABLE event_categories (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- Events ↔ Media
CREATE TABLE event_media (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (event_id, media_id)
);

-- Events ↔ Characters (participation)
CREATE TABLE event_characters (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL DEFAULT 'participant'
    CHECK (role IN (
      'protagonist', 'antagonist', 'witness', 'participant',
      'victim', 'beneficiary', 'performer', 'competitor',
      'owner', 'creator', 'observer'
    )),
  significance VARCHAR(50) NOT NULL DEFAULT 'secondary'
    CHECK (significance IN ('primary', 'secondary', 'minor', 'mentioned')),
  description TEXT,
  PRIMARY KEY (event_id, character_id)
);

-- Timelines ↔ Events
CREATE TABLE timeline_events (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (timeline_id, event_id)
);

-- Periods ↔ Timelines
CREATE TABLE period_timelines (
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  PRIMARY KEY (period_id, timeline_id)
);

-- Stories ↔ Periods
CREATE TABLE story_periods (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, period_id)
);

-- Stories ↔ Characters
CREATE TABLE story_characters (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role_in_story VARCHAR(50) DEFAULT 'mentioned'
    CHECK (role_in_story IN ('protagonist', 'supporting', 'mentioned', 'narrator')),
  PRIMARY KEY (story_id, character_id)
);

-- Stories ↔ Events
CREATE TABLE story_events (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, event_id)
);

-- Characters ↔ Media
CREATE TABLE character_media (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (character_id, media_id)
);

-- Timelines ↔ Collaborators
CREATE TABLE timeline_collaborators (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer'
    CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (timeline_id, user_id)
);

-- Timelines ↔ Media
CREATE TABLE timeline_media (
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (timeline_id, media_id)
);

-- ============================================================================
-- updated_at trigger (character_relationships has updated_at; junctions don't)
-- ============================================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON character_relationships
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- Enable RLS (default deny until policies land in issue #19)
-- ============================================================================

ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media             ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_characters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_timelines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_periods           ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_characters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_media         ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_collaborators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_media          ENABLE ROW LEVEL SECURITY;
