-- pgTAP tests for 00025_characters_sort_order_years.sql (issue #326 —
-- characters.sort_order_years generated column).
begin;
create extension if not exists pgtap with schema extensions;

select plan(11);

-- ============================================================================
-- Column presence + type
-- ============================================================================

select has_column(
  'public', 'characters', 'sort_order_years',
  'characters.sort_order_years column exists'
);

select col_type_is(
  'public', 'characters', 'sort_order_years', 'bigint',
  'characters.sort_order_years is bigint'
);

select has_index(
  'public', 'characters', 'idx_characters_sort',
  'idx_characters_sort index exists'
);

-- ============================================================================
-- Test fixtures
-- ============================================================================

insert into auth.users (id, instance_id, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at, aud, role)
  values ('00000000-0000-0000-0000-000000000326'::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          'characters-sort-326@local', '', now(), now(), now(),
          'authenticated', 'authenticated');

insert into characters (user_id, slug, name, character_type, birth_temporal, death_temporal) values
  ('00000000-0000-0000-0000-000000000326', 'sort-ce',      'CE Character',      'human',
   '{"year":1969,"era":"CE","precision":"exact"}'::jsonb, null),
  ('00000000-0000-0000-0000-000000000326', 'sort-bce',     'BCE Character',     'human',
   '{"year":44,"era":"BCE","precision":"exact"}'::jsonb, null),
  ('00000000-0000-0000-0000-000000000326', 'sort-kya',     'KYA Character',     'mythological',
   '{"year":12,"era":"KYA","precision":"approximate"}'::jsonb, null),
  ('00000000-0000-0000-0000-000000000326', 'sort-mya',     'MYA Character',     'mythological',
   '{"year":66,"era":"MYA","precision":"approximate"}'::jsonb, null),
  ('00000000-0000-0000-0000-000000000326', 'sort-bya',     'BYA Character',     'divine',
   '{"year":14,"era":"BYA","precision":"geological"}'::jsonb, null),
  ('00000000-0000-0000-0000-000000000326', 'sort-death',   'Death-only Character', 'human',
   null, '{"year":1616,"era":"CE","precision":"exact"}'::jsonb),
  ('00000000-0000-0000-0000-000000000326', 'sort-both',    'Both-dates Character', 'human',
   '{"year":1564,"era":"CE","precision":"exact"}'::jsonb,
   '{"year":1616,"era":"CE","precision":"exact"}'::jsonb),
  ('00000000-0000-0000-0000-000000000326', 'sort-neither',  'Undated Character', 'divine',
   null, null);

-- ============================================================================
-- Era conversion, keyed off birth_temporal
-- ============================================================================

select is((select sort_order_years from characters where slug = 'sort-ce'),
          1969::bigint, 'CE 1969 → sort_order_years = 1969');
select is((select sort_order_years from characters where slug = 'sort-bce'),
          -44::bigint, 'BCE 44 → sort_order_years = -44');
select is((select sort_order_years from characters where slug = 'sort-kya'),
          -12000::bigint, 'KYA 12 → sort_order_years = -12,000');
select is((select sort_order_years from characters where slug = 'sort-mya'),
          -66000000::bigint, 'MYA 66 → sort_order_years = -66,000,000');
select is((select sort_order_years from characters where slug = 'sort-bya'),
          -14000000000::bigint, 'BYA 14 → sort_order_years = -14,000,000,000');

-- ============================================================================
-- Fallback + NULL behaviour
-- ============================================================================

select is((select sort_order_years from characters where slug = 'sort-death'),
          1616::bigint,
          'death_temporal is used when birth_temporal is absent');

select is((select sort_order_years from characters where slug = 'sort-both'),
          1564::bigint,
          'birth_temporal wins when both birth_temporal and death_temporal are present');

select is((select sort_order_years from characters where slug = 'sort-neither'),
          null,
          'sort_order_years is NULL when neither birth_temporal nor death_temporal is set');

select * from finish();
rollback;
