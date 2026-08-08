-- pgTAP tests for 00030_seed_relationship_vocabulary.sql (issue #419 — the
-- foundational relationship ontology).
--
-- Unlike most suites here this one asserts against migration-seeded rows rather
-- than its own fixtures: the point of 00030 is that every environment ends up
-- with the same codebook, so the row counts and metadata ARE the contract.
begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

-- ============================================================================
-- Row counts — the shape of the ontology
-- ============================================================================

select is(
  (select count(*)::int from public.relationship_categories),
  10,
  '10 categories seeded');

select is(
  (select count(*)::int from public.relationship_types),
  32,
  '32 relationship types seeded');

select is(
  (select count(*)::int from public.relationship_roles),
  32,
  '32 sub-roles seeded (16 family + 9 professional + 7 collaboration)');

select is(
  (select count(*)::int from public.relationship_roles where type_key = 'family'),
  16, 'family declares 16 sub-roles');
select is(
  (select count(*)::int from public.relationship_roles where type_key = 'professional'),
  9, 'professional declares 9 sub-roles');
select is(
  (select count(*)::int from public.relationship_roles where type_key = 'collaboration'),
  7, 'collaboration declares 7 sub-roles');

-- Exactly three types are role-bearing; everything else takes NULL role only.
select is(
  (select count(distinct type_key)::int from public.relationship_roles),
  3,
  'only three types declare sub-roles — the rest accept NULL role only');

-- ============================================================================
-- Symmetry split — this is what drives reciprocal-row creation
-- ============================================================================

select is(
  (select count(*)::int from public.relationship_types where is_symmetric),
  6,
  '6 symmetric types (family, professional, collaboration, friendship, rivalry, enemy)');

select is(
  (select count(*)::int from public.relationship_types where not is_symmetric),
  26,
  '26 directed types (5 original asymmetric + 21 causal)');

select set_eq(
  $$select key from public.relationship_types where is_symmetric$$,
  $$values ('family'),('professional'),('collaboration'),
           ('friendship'),('rivalry'),('enemy')$$,
  'the symmetric set is exactly the six social types');

-- The causal verbs are directed by construction. Getting this wrong is what
-- made the previous CHECK-based vocabulary generate reversed claims.
select is_empty(
  $$select key from public.relationship_types
    where is_symmetric
      and category_key in ('derivational','epistemic','institutional','critical','reception')$$,
  'no causal/derivational verb is marked symmetric');

-- ============================================================================
-- Display metadata — a type must render as something
-- ============================================================================

select is_empty(
  $$select key from public.relationship_types
    where is_symmetric and symmetric_noun is null$$,
  'every symmetric type has a symmetric_noun for "A and B are <noun>"');

select is_empty(
  $$select key from public.relationship_types
    where not is_symmetric and direction_verb is null$$,
  'every directed type has a direction_verb for "A <verb> B"');

select is_empty(
  $$select key from public.relationship_types
    where direction_verb is null and symmetric_noun is null$$,
  'no type falls back to the bare "A — B" rendering');

select is_empty(
  $$select key from public.relationship_types where description is null$$,
  'every type carries authoring guidance');

-- Parity with the maps these columns replaced, so rendering is unchanged.
select is(
  (select direction_verb from public.relationship_types where key = 'mentor_student'),
  'mentors', 'mentor_student keeps its original verb');
select is(
  (select symmetric_noun from public.relationship_types where key = 'friendship'),
  'friends', 'friendship keeps its original noun');

-- ============================================================================
-- Referential + ordering integrity
-- ============================================================================

select is_empty(
  $$select t.key from public.relationship_types t
    left join public.relationship_categories c on c.key = t.category_key
    where c.key is null$$,
  'every type resolves to a seeded category');

-- Category sort_order must be distinct or group ordering is non-deterministic.
select is(
  (select count(distinct sort_order)::int from public.relationship_categories),
  10,
  'category sort_order values are distinct — grouping order is deterministic');

-- Role inverses must themselves be real roles of the same type, or the
-- reciprocal row would reference a non-existent (type, role) pair.
select is_empty(
  $$select r.type_key || '.' || r.key
      from public.relationship_roles r
      left join public.relationship_roles inv
        on inv.type_key = r.type_key and inv.key = r.inverse_key
     where r.inverse_key is not null and inv.key is null$$,
  'every role inverse resolves to a role of the same type');

-- Inversion must be involutive: inverse(inverse(x)) = x. Otherwise editing a
-- relationship would drift its reciprocal's role.
select is_empty(
  $$select r.type_key || '.' || r.key
      from public.relationship_roles r
      join public.relationship_roles inv
        on inv.type_key = r.type_key and inv.key = r.inverse_key
     where inv.inverse_key is distinct from r.key$$,
  'role inversion is involutive (parent->child->parent)');

select is(
  (select inverse_key from public.relationship_roles
    where type_key = 'family' and key = 'parent'),
  'child', 'parent inverts to child');

-- No seeded type names an inverse type yet; the column exists for future
-- vocabulary and its absence keeps the self-FK inert during seeding.
select is(
  (select count(*)::int from public.relationship_types where inverse_key is not null),
  0,
  'no seeded type declares an inverse_key');

-- ============================================================================
-- Idempotency — 00030 is a bootstrap, not a sync point
-- ============================================================================

select lives_ok(
  $$insert into public.relationship_categories (key, label, sort_order)
    values ('family', 'Rewritten label', 999)
    on conflict (key) do nothing$$,
  're-running a category insert is a no-op, not an error');

select is(
  (select label from public.relationship_categories where key = 'family'),
  'Family',
  'a curated label survives re-running the seed');

select * from finish();
rollback;
