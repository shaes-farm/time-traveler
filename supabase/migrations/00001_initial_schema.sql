-- ============================================================================
-- 00001_initial_schema.sql
--
-- Core content tables for the Time Traveler greenfield schema (issue #13).
-- See docs/system-design.md §3.2 for column-level specification and §4.4 for
-- the era conversion formula used by all sort_order generated columns.
--
-- Relationship and junction tables live in 00002_relationships_junctions.sql.
-- RLS policies (issue #19), performance indexes (#17), supporting tables (#15),
-- is_admin()/profile trigger (#16), and database functions (#20) follow in
-- separate migrations.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- array_to_string is marked STABLE in PostgreSQL because it is generic over
-- array element type, so it cannot be used directly in GENERATED ALWAYS AS.
-- For TEXT[] specifically the result is deterministic, so wrapping in an
-- IMMUTABLE SQL function is safe and lets the characters.search_vector
-- generated column reference aliases.
CREATE OR REPLACE FUNCTION immutable_array_to_string(arr TEXT[], sep TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT array_to_string(arr, sep);
$$;

-- ============================================================================
-- Core Tables
-- ============================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  role VARCHAR(20) DEFAULT 'editor'
    CHECK (role IN ('editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT first_name_length CHECK (char_length(first_name) > 1),
  CONSTRAINT last_name_length CHECK (char_length(last_name) > 1),
  CONSTRAINT username_length CHECK (username IS NULL OR char_length(username) >= 3)
);

CREATE UNIQUE INDEX profiles_username_idx ON profiles (username) WHERE username IS NOT NULL;

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(2000) NOT NULL,
  character_type VARCHAR(50) NOT NULL
    CHECK (character_type IN (
      'human', 'animal', 'mythological', 'fictional',
      'organization', 'divine', 'artifact'
    )),
  biography TEXT,
  aliases TEXT[],
  cultural_context TEXT[],
  physical_description TEXT,
  species VARCHAR(500),
  breed VARCHAR(500),
  domain VARCHAR(500),
  significance VARCHAR(20) DEFAULT 'medium'
    CHECK (significance IN ('low', 'medium', 'high', 'critical')),
  birth_temporal JSONB,
  death_temporal JSONB,
  profile_data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(name, '') || ' ' ||
      coalesce(biography, '') || ' ' ||
      coalesce(immutable_array_to_string(aliases, ' '), '')
    )
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX characters_slug_idx ON characters (user_id, slug);

CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  scale VARCHAR(2000),
  temporal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order_start BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (temporal_data->>'era') = 'CE' THEN (temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'BCE' THEN -(temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'KYA' THEN -(temporal_data->>'year')::BIGINT * 1000
      WHEN (temporal_data->>'era') = 'MYA' THEN -(temporal_data->>'year')::BIGINT * 1000000
      WHEN (temporal_data->>'era') = 'BYA' THEN -(temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  end_temporal_data JSONB DEFAULT '{}'::jsonb,
  sort_order_end BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (end_temporal_data->>'era') = 'CE' THEN (end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'BCE' THEN -(end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'KYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000
      WHEN (end_temporal_data->>'era') = 'MYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000
      WHEN (end_temporal_data->>'era') = 'BYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  timeline_type VARCHAR(50) DEFAULT 'general'
    CHECK (timeline_type IN ('general', 'biographical', 'comparative')),
  subject_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  visibility VARCHAR(20) DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'shared')),
  fractal_depth INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, '')
    )
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX timelines_slug_idx ON timelines (user_id, slug);

CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  temporal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order_start BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (temporal_data->>'era') = 'CE' THEN (temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'BCE' THEN -(temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'KYA' THEN -(temporal_data->>'year')::BIGINT * 1000
      WHEN (temporal_data->>'era') = 'MYA' THEN -(temporal_data->>'year')::BIGINT * 1000000
      WHEN (temporal_data->>'era') = 'BYA' THEN -(temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  end_temporal_data JSONB DEFAULT '{}'::jsonb,
  sort_order_end BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (end_temporal_data->>'era') = 'CE' THEN (end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'BCE' THEN -(end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'KYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000
      WHEN (end_temporal_data->>'era') = 'MYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000
      WHEN (end_temporal_data->>'era') = 'BYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  parent_period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  significance VARCHAR(20) DEFAULT 'medium'
    CHECK (significance IN ('low', 'medium', 'high', 'critical')),
  characteristics TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX periods_slug_idx ON periods (user_id, slug);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  summary TEXT,
  detail TEXT,
  event_type VARCHAR(100) DEFAULT 'milestone'
    CHECK (event_type IN (
      'milestone', 'period', 'incident', 'discovery', 'creation',
      'destruction', 'transformation', 'migration', 'conflict', 'ceremony'
    )),
  temporal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order_years BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (temporal_data->>'era') = 'CE' THEN (temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'BCE' THEN -(temporal_data->>'year')::BIGINT
      WHEN (temporal_data->>'era') = 'KYA' THEN -(temporal_data->>'year')::BIGINT * 1000
      WHEN (temporal_data->>'era') = 'MYA' THEN -(temporal_data->>'year')::BIGINT * 1000000
      WHEN (temporal_data->>'era') = 'BYA' THEN -(temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  computed_start_date TIMESTAMPTZ GENERATED ALWAYS AS (
    CASE
      WHEN (temporal_data->>'era') = 'CE'
        AND (temporal_data->>'year')::BIGINT > -4712
      THEN make_timestamp(
        (temporal_data->>'year')::INT,
        COALESCE((temporal_data->>'month')::INT, 1),
        COALESCE((temporal_data->>'day')::INT, 1),
        COALESCE((temporal_data->>'hour')::INT, 0),
        COALESCE((temporal_data->>'minute')::INT, 0),
        COALESCE((temporal_data->>'second')::DOUBLE PRECISION, 0)
      ) AT TIME ZONE 'UTC'
      ELSE NULL
    END
  ) STORED,
  end_temporal_data JSONB DEFAULT '{}'::jsonb,
  sort_order_end BIGINT GENERATED ALWAYS AS (
    CASE
      WHEN (end_temporal_data->>'era') = 'CE' THEN (end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'BCE' THEN -(end_temporal_data->>'year')::BIGINT
      WHEN (end_temporal_data->>'era') = 'KYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000
      WHEN (end_temporal_data->>'era') = 'MYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000
      WHEN (end_temporal_data->>'era') = 'BYA' THEN -(end_temporal_data->>'year')::BIGINT * 1000000000
      ELSE 0
    END
  ) STORED,
  computed_end_date TIMESTAMPTZ GENERATED ALWAYS AS (
    CASE
      WHEN (end_temporal_data->>'era') = 'CE'
        AND (end_temporal_data->>'year')::BIGINT > -4712
      THEN make_timestamp(
        (end_temporal_data->>'year')::INT,
        COALESCE((end_temporal_data->>'month')::INT, 1),
        COALESCE((end_temporal_data->>'day')::INT, 1),
        COALESCE((end_temporal_data->>'hour')::INT, 0),
        COALESCE((end_temporal_data->>'minute')::INT, 0),
        COALESCE((end_temporal_data->>'second')::DOUBLE PRECISION, 0)
      ) AT TIME ZONE 'UTC'
      ELSE NULL
    END
  ) STORED,
  location VARCHAR(2000),
  spatial_data JSONB,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, '')
    )
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX events_slug_idx ON events (user_id, slug);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  sub_title VARCHAR(2000),
  summary TEXT,
  detail TEXT,
  perspective_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  narrator_type VARCHAR(50) CHECK (
    narrator_type IN ('first_person', 'third_person', 'omniscient')
  ),
  tags TEXT[],
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(sub_title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(detail, '')
    )
  ) STORED,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX stories_slug_idx ON stories (user_id, slug);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(2000) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(100),
  parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_idx ON categories (user_id, slug);

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  slug VARCHAR(100) NOT NULL,
  alt_text TEXT,
  caption TEXT,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  media_type VARCHAR(50) CHECK (
    media_type IN ('image', 'video', 'audio', 'document')
  ),
  width INTEGER,
  height INTEGER,
  file_size_bytes BIGINT,
  mime_type VARCHAR(200),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX media_slug_idx ON media (user_id, slug);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON timelines
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON periods
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- Enable RLS (default deny until policies land in issue #19)
-- ============================================================================

ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media      ENABLE ROW LEVEL SECURITY;
