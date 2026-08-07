-- ============================================================================
-- 00030_seed_relationship_vocabulary.sql
--
-- The foundational relationship ontology: 10 categories, 32 types, 32 sub-roles.
-- Companion to 00029_relationship_vocabulary.sql, which created the tables and
-- deliberately seeded nothing. See
-- docs/adr/adr-0040-relationship-vocabulary-reference-data.md (issue #419).
--
-- Why this is a migration and not a seed script
-- ---------------------------------------------
-- This vocabulary is a CODEBOOK — the value domain of a categorical variable —
-- not corpus content. It has to exist in every environment for the
-- relationships feature to function at all, because character_relationships
-- now carries an FK into relationship_types. Seed scripts are run locally and
-- never reach staging or production, so vocabulary owned by one would leave
-- those environments with an empty domain and no way to create a relationship.
--
-- It is also defined a priori rather than induced by whichever corpora happen
-- to be loaded: it enumerates the ways any of the seven character types may
-- relate to any other. Levels with zero observations are intentional — a
-- codebook that lists only what a corpus uses cannot distinguish "no
-- mentor_student relationships were recorded" from "mentor_student is not a
-- thing".
--
-- Bootstrap, not a sync point
-- ---------------------------
-- Every insert is ON CONFLICT DO NOTHING, so re-running never clobbers
-- vocabulary an administrator has since curated through the admin UI (#428).
-- Later vocabulary changes are data operations; do not amend this file to make
-- them.
--
-- NOTE: 00029 and this migration are not independently deployable. Between
-- them relationship_types is empty and no relationship can be created. Deploy
-- them together.
--
-- Insert order follows the FK chain: categories -> types -> roles.
-- `inverse_key` is NULL on every seeded type, so relationship_types' self-FK
-- never fires here.
-- ============================================================================

-- ============================================================================
-- 1. Categories — group and order the type picker
--
-- sort_order gaps of 10 leave room to insert a group without renumbering.
-- Social groupings come first, causal/derivational ones after.
-- ============================================================================

INSERT INTO public.relationship_categories (key, label, description, sort_order) VALUES
  ('family',        'Family',            'Kinship ties.',                                              10),
  ('professional',  'Professional',      'Work, employment and joint enterprise.',                     20),
  ('social',        'Social / Personal', 'Chosen bonds between peers.',                                30),
  ('antagonistic',  'Antagonistic',      'Declared hostility.',                                        40),
  ('asymmetric',    'Asymmetric',        'Roles where direction is carried by the type itself.',       50),
  ('derivational',  'Derivational',      'One thing descends from, improves on or displaces another.', 60),
  ('epistemic',     'Epistemic',         'Acts of observing, predicting, measuring and naming.',       70),
  ('institutional', 'Institutional',     'Standardisation, adoption and formal recognition.',          80),
  ('critical',      'Critical',          'Dispute, contradiction and rejection.',                      90),
  ('reception',     'Reception',         'How work was neglected or recovered over time.',            100)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. Types
--
-- is_symmetric drives reciprocal-row creation (see computeReciprocalRow):
--   true            -> saving writes a mirrored row of the same type
--   false + inverse -> writes the reciprocal under inverse_key
--   false + NULL    -> single directed row; the reverse is a separate claim
--
-- 6 of the 32 are symmetric; the other 26 are directed. Every directed type
-- gets a direction_verb and every symmetric type a symmetric_noun, because the
-- relationship card renders one or the other — a type with neither falls back
-- to a bare "X — Y".
-- ============================================================================

-- ---- The original interpersonal vocabulary (was the 00002 CHECK) -----------
-- direction_verb / symmetric_noun values reproduce the maps previously
-- hard-coded in the admin detail helpers, so rendering is unchanged.

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('family',           'Family',             'family',       10, true,  NULL,        'relatives',      'Kinship of any degree; use a sub-role to be specific.'),

  ('professional',     'Professional',       'professional', 10, true,  NULL,        'colleagues',     'A working relationship; use a sub-role for the direction.'),
  ('collaboration',    'Collaboration',      'professional', 20, true,  NULL,        'collaborators',  'Joint creative or research work.'),

  ('friendship',       'Friendship',         'social',       10, true,  NULL,        'friends',        'A chosen personal bond.'),
  ('rivalry',          'Rivalry',            'social',       20, true,  NULL,        'rivals',         'Competitive but not hostile.'),

  ('enemy',            'Enemy',              'antagonistic', 10, true,  NULL,        'enemies',        'Declared and mutual hostility.'),

  ('mentor_student',   'Mentor / student',   'asymmetric',   10, false, 'mentors',   NULL,             'The subject guides the object''s development.'),
  ('owner_pet',        'Owner / pet',        'asymmetric',   20, false, 'owns',      NULL,             'The subject keeps the object as an animal companion.'),
  ('trainer_trainee',  'Trainer / trainee',  'asymmetric',   30, false, 'trains',    NULL,             'The subject trains the object in a specific skill.'),
  ('creator_creation', 'Creator / creation', 'asymmetric',   40, false, 'created',   NULL,             'The subject brought the object into existence.'),
  ('worship',          'Worship',            'asymmetric',   50, false, 'worships',  NULL,             'The subject venerates the object.')
ON CONFLICT (key) DO NOTHING;

-- ---- Derivational: descent, improvement and displacement -------------------

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('superseded',   'Superseded',   'derivational', 10, false, 'superseded',   NULL, 'The subject replaced the object as the prevailing approach.'),
  ('derived_from', 'Derived from', 'derivational', 20, false, 'derives from', NULL, 'The subject descends from the object.'),
  ('improved',     'Improved',     'derivational', 30, false, 'improved',     NULL, 'The subject refined the object without replacing it.'),
  ('enabled',      'Enabled',      'derivational', 40, false, 'enabled',      NULL, 'The subject made the object possible.'),
  ('copied',       'Copied',       'derivational', 50, false, 'copied',       NULL, 'The subject reproduced the object''s method or form.'),
  ('succeeded',    'Succeeded',    'derivational', 60, false, 'succeeded',    NULL, 'The subject followed the object in a line of succession.'),
  ('influenced',   'Influenced',   'derivational', 70, false, 'influenced',   NULL, 'The subject shaped the object''s direction.'),
  ('inspired',     'Inspired',     'derivational', 80, false, 'inspired',     NULL, 'The subject prompted the object''s creation.')
ON CONFLICT (key) DO NOTHING;

-- ---- Epistemic: observing, predicting, measuring, naming -------------------
--
-- These describe one character's stance toward another's work. Where the
-- object is an EVENT rather than a character, model it as event_characters
-- participation instead (the `observer` role) — character_relationships links
-- character to character only.

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('observed',   'Observed',   'epistemic', 10, false, 'observed',   NULL, 'The subject recorded the object directly.'),
  ('predicted',  'Predicted',  'epistemic', 20, false, 'predicted',  NULL, 'The subject foretold the object before it was confirmed.'),
  ('calculated', 'Calculated', 'epistemic', 30, false, 'calculated', NULL, 'The subject derived the object numerically.'),
  ('measured',   'Measured',   'epistemic', 40, false, 'measured',   NULL, 'The subject quantified the object.'),
  ('named',      'Named',      'epistemic', 50, false, 'named',      NULL, 'The subject gave the object its name.')
ON CONFLICT (key) DO NOTHING;

-- ---- Institutional: standardisation, adoption, recognition -----------------

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('standardized', 'Standardized', 'institutional', 10, false, 'standardized', NULL, 'The subject fixed the object as a formal standard.'),
  ('adopted',      'Adopted',      'institutional', 20, false, 'adopted',      NULL, 'The subject took the object into official use.'),
  ('patented',     'Patented',     'institutional', 30, false, 'patented',     NULL, 'The subject secured formal rights over the object.')
ON CONFLICT (key) DO NOTHING;

-- ---- Critical: dispute and rejection ---------------------------------------

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('challenged',   'Challenged',   'critical', 10, false, 'challenged',   NULL, 'The subject disputed the object.'),
  ('contradicted', 'Contradicted', 'critical', 20, false, 'contradicted', NULL, 'The subject''s findings are incompatible with the object''s.'),
  ('rejected',     'Rejected',     'critical', 30, false, 'rejected',     NULL, 'The subject formally repudiated the object.')
ON CONFLICT (key) DO NOTHING;

-- ---- Reception: neglect and recovery ---------------------------------------

INSERT INTO public.relationship_types
  (key, label, category_key, sort_order, is_symmetric, direction_verb, symmetric_noun, description)
VALUES
  ('forgotten',     'Forgotten',     'reception', 10, false, 'forgot',       NULL, 'The subject lost knowledge of the object.'),
  ('rediscovered',  'Rediscovered',  'reception', 20, false, 'rediscovered', NULL, 'The subject recovered the object after a period of neglect.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. Sub-roles (ADR-0009 taxonomy)
--
-- Only the three role-bearing types get rows; every other type accepts NULL
-- role only, which the composite FK enforces by having nothing to match.
-- inverse_key is the role the reciprocal row carries: paired roles invert
-- (parent <-> child), symmetric roles map to themselves (spouse <-> spouse).
-- ============================================================================

INSERT INTO public.relationship_roles (type_key, key, label, inverse_key, sort_order) VALUES
  ('family', 'spouse',          'Spouse',          'spouse',          10),
  ('family', 'parent',          'Parent',          'child',           20),
  ('family', 'child',           'Child',           'parent',          30),
  ('family', 'sibling',         'Sibling',         'sibling',         40),
  ('family', 'grandparent',     'Grandparent',     'grandchild',      50),
  ('family', 'grandchild',      'Grandchild',      'grandparent',     60),
  ('family', 'aunt_uncle',      'Aunt / uncle',    'niece_nephew',    70),
  ('family', 'niece_nephew',    'Niece / nephew',  'aunt_uncle',      80),
  ('family', 'cousin',          'Cousin',          'cousin',          90),
  ('family', 'in_law',          'In-law',          'in_law',         100),
  ('family', 'step_parent',     'Step-parent',     'step_child',     110),
  ('family', 'step_child',      'Step-child',      'step_parent',    120),
  ('family', 'step_sibling',    'Step-sibling',    'step_sibling',   130),
  ('family', 'adoptive_parent', 'Adoptive parent', 'adoptive_child', 140),
  ('family', 'adoptive_child',  'Adoptive child',  'adoptive_parent',150),
  ('family', 'other',           'Other',           'other',          160),

  ('professional', 'employer',         'Employer',         'employee',         10),
  ('professional', 'employee',         'Employee',         'employer',         20),
  ('professional', 'colleague',        'Colleague',        'colleague',        30),
  ('professional', 'supervisor',       'Supervisor',       'subordinate',      40),
  ('professional', 'subordinate',      'Subordinate',      'supervisor',       50),
  ('professional', 'business_partner', 'Business partner', 'business_partner', 60),
  ('professional', 'client',           'Client',           'vendor',           70),
  ('professional', 'vendor',           'Vendor',           'client',           80),
  ('professional', 'other',            'Other',            'other',            90),

  ('collaboration', 'co_author',           'Co-author',           'co_author',           10),
  ('collaboration', 'co_founder',          'Co-founder',          'co_founder',          20),
  ('collaboration', 'research_partner',    'Research partner',    'research_partner',    30),
  ('collaboration', 'performance_partner', 'Performance partner', 'performance_partner', 40),
  ('collaboration', 'band_member',         'Band member',         'band_member',         50),
  ('collaboration', 'creative_partner',    'Creative partner',    'creative_partner',    60),
  ('collaboration', 'other',               'Other',               'other',               70)
ON CONFLICT (type_key, key) DO NOTHING;
