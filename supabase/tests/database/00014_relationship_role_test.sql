-- pgTAP tests for 00014_relationship_role.sql (issue #119 — add nullable
-- relationship_role column to character_relationships with type-conditional
-- CHECK constraints and an extended unique index).
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- ============================================================================
-- Column presence + type
-- ============================================================================

select has_column(
  'public', 'character_relationships', 'relationship_role',
  'character_relationships.relationship_role column exists'
);

select col_type_is(
  'public', 'character_relationships', 'relationship_role',
  'character varying(100)',
  'character_relationships.relationship_role is varchar(100)'
);

select col_is_null(
  'public', 'character_relationships', 'relationship_role',
  'character_relationships.relationship_role is nullable'
);

-- ============================================================================
-- relationship_role_valid CHECK constraint
-- ============================================================================

select lives_ok(
  $$
    do $body$
    declare
      v_user_id uuid := '00000000-0000-0000-0000-000000000000';
      v_char_a uuid;
      v_char_b uuid;
    begin
      -- Seed auth.users for FK integrity.
      insert into auth.users (id, instance_id, email, encrypted_password,
                              email_confirmed_at, created_at, updated_at, aud, role)
        values (v_user_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                'rel-role-119@local', '', now(), now(), now(),
                'authenticated', 'authenticated');

      insert into public.characters (user_id, slug, name, character_type)
        values (v_user_id, 'char-a-119', 'Char A', 'human')
        returning id into v_char_a;
      insert into public.characters (user_id, slug, name, character_type)
        values (v_user_id, 'char-b-119', 'Char B', 'human')
        returning id into v_char_b;

      -- Accepts each kind of sub-role (sample, not exhaustive).
      insert into public.character_relationships
        (user_id, character_id, related_character_id, relationship_type, relationship_role)
        values (v_user_id, v_char_a, v_char_b, 'family', 'parent');
      insert into public.character_relationships
        (user_id, character_id, related_character_id, relationship_type, relationship_role)
        values (v_user_id, v_char_a, v_char_b, 'family', 'step_parent');
      insert into public.character_relationships
        (user_id, character_id, related_character_id, relationship_type, relationship_role)
        values (v_user_id, v_char_b, v_char_a, 'professional', 'employer');
      insert into public.character_relationships
        (user_id, character_id, related_character_id, relationship_type, relationship_role)
        values (v_user_id, v_char_b, v_char_a, 'collaboration', 'co_author');

      -- NULL role is always accepted.
      insert into public.character_relationships
        (user_id, character_id, related_character_id, relationship_type, relationship_role)
        values (v_user_id, v_char_a, v_char_b, 'friendship', null);
    end
    $body$;
  $$,
  'valid sub-roles per type are accepted, NULL role is accepted'
);

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'family', 'ally');
  $$,
  23514,
  null,
  'rejects invalid sub-role for family (ally not in enum)'
);

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'professional', 'spouse');
  $$,
  23514,
  null,
  'rejects role that belongs to a different type (spouse is family-only)'
);

-- ============================================================================
-- relationship_role_null_for_other_types CHECK
-- ============================================================================

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'friendship', 'spouse');
  $$,
  23514,
  null,
  'rejects non-NULL role on friendship (must be NULL)'
);

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'mentor_student', 'parent');
  $$,
  23514,
  null,
  'rejects non-NULL role on mentor_student'
);

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'rivalry', 'colleague');
  $$,
  23514,
  null,
  'rejects non-NULL role on rivalry'
);

-- ============================================================================
-- Extended unique index — same pair+type with different roles permitted;
-- duplicate (pair, type, role) still rejected.
-- ============================================================================

-- (Already inserted (char_a, char_b, family, parent) and (char_a, char_b, family, step_parent)
-- in the first lives_ok block — that itself proves multi-role-per-pair works.)

select throws_ok(
  $$
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'family', 'parent');
  $$,
  23505,
  null,
  'duplicate (pair, type, role) rejected by unique index'
);

select lives_ok(
  $$
    -- A NULL-role row coexists with a specific-role row for the same pair+type
    -- because NULL ≠ "parent" under both NULLS DISTINCT and NULLS NOT DISTINCT.
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'family', null);
  $$,
  'NULL role coexists with specific role for same pair+type (legacy compat)'
);

select throws_ok(
  $$
    -- A second NULL-role row for the same pair+type is blocked under
    -- NULLS NOT DISTINCT, preserving the original "one of each (pair, type)"
    -- guarantee for legacy data.
    insert into public.character_relationships
      (user_id, character_id, related_character_id, relationship_type, relationship_role)
      values ('00000000-0000-0000-0000-000000000000',
              (select id from public.characters where slug = 'char-a-119'),
              (select id from public.characters where slug = 'char-b-119'),
              'family', null);
  $$,
  23505,
  null,
  'duplicate NULL-role row blocked by NULLS NOT DISTINCT'
);

-- ============================================================================
-- Index metadata sanity
-- ============================================================================

select has_index(
  'public', 'character_relationships', 'char_rels_unique',
  'char_rels_unique unique index exists after recreation'
);

select is(
  (select array_to_string(array_agg(att.attname order by ix.attnum_pos), ',')
     from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join unnest(i.indkey) with ordinality as ix(attnum, attnum_pos)
       on true
     join pg_attribute att on att.attrelid = i.indrelid and att.attnum = ix.attnum
    where c.relname = 'char_rels_unique'),
  'character_id,related_character_id,relationship_type,relationship_role',
  'char_rels_unique columns include relationship_role'
);

select is(
  (select indisunique from pg_index i
     join pg_class c on c.oid = i.indexrelid
    where c.relname = 'char_rels_unique'),
  true,
  'char_rels_unique is still a unique index'
);

select is(
  (select count(*)::int from pg_constraint
    where conname in ('relationship_role_valid', 'relationship_role_null_for_other_types')
      and conrelid = 'public.character_relationships'::regclass),
  2,
  'both relationship_role CHECK constraints exist'
);

select * from finish();
rollback;
