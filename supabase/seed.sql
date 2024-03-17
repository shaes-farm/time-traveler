INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) VALUES ('00000000-0000-0000-0000-000000000000', 'cb1d95e6-076d-4328-856e-912fa4227fb0', 'authenticated', 'authenticated', 'time.traveler@shaes.farm', '$2a$10$LnajVGTGwuqeA6po2qcAVOPH2U3rijZ9O487chc9jwOrs3HRiFeYm', '2024-02-22 00:50:04.710981+00', NULL, '', NULL, '', NULL, '', '', NULL, '2024-02-22 00:50:04.713249+00', '{"provider": "email", "providers": ["email"]}', '{"last_name": "Traveler", "first_name": "Time"}', NULL, '2024-02-22 00:50:04.706693+00', '2024-02-22 00:50:04.714776+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL);
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'cb1d95e6-076d-4328-856e-912fa4227fb0', '{"sub": "cb1d95e6-076d-4328-856e-912fa4227fb0", "email": "time.traveler@shaes.farm", "email_verified": false, "phone_verified": false}', 'email', '2024-02-22 00:50:04.70976+00', '2024-02-22 00:50:04.709789+00', '2024-02-22 00:50:04.709789+00', '80818804-a670-4b34-a83e-86be2696e495');

insert into public.stories
    (user_id, slug, title, sub_title, summary, detail)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'the-first-story', 'The First Story', 'The beginning of it all', 'The first story summary.', '## The First Story

Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga

Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.'
    );

insert into public.periods
    (user_id, slug, title, summary, begin_date, end_date)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-one', 'Period One', 'The first period.', '1.000', '1.999'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-two', 'Period Two', 'The second period.', '2.000', '2.999'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-three', 'Period Three', 'The third period.', '3.000', '3.999');

insert into public.timelines
    (user_id, slug, title, summary, scale, begin_date, end_date)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-one-timeline-one', 'Period One Timeline One', 'First timeline of the first period.', 'all dates are decimal numbers', '1.000', '1.333'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-one-timeline-two', 'Period One Timeline Two', 'Second timeline of the first period.', 'all dates are decimal numbers', '1.333', '1.666'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-one-timeline-three', 'Period One Timeline Three', 'Third timeline of the first period.', 'all dates are decimal numbers', '1.666', '1.999'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-two-timeline-one', 'Period Two Timeline One', 'First timeline of the second period.', 'all dates are decimal numbers', '2.000', '2.333'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-two-timeline-two', 'Period Two Timeline Two', 'Second timeline of the second period.', 'all dates are decimal numbers', '2.333', '2.666'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-two-timeline-three', 'Period Two Timeline Three', 'Third timeline of the second period.', 'all dates are decimal numbers', '2.666', '2.999'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-three-timeline-one', 'Period Three Timeline One', 'First timeline of the third period.', 'all dates are decimal numbers', '3.000', '3.333'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-three-timeline-two', 'Period Three Timeline Two', 'Second timeline of the third period.', 'all dates are decimal numbers', '3.333', '3.666'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'period-three-timeline-three', 'Period Three Timeline Three', 'Third timeline of the third period.', 'all dates are decimal numbers', '3.666', '3.999');

insert into public.historical_events
    (user_id, slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'the-first-event', 'The First Event', 'The first event summary.', '## The Event Header
Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga
Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.

- A list item
- A list item
- A list item

1. A numbered list item
2. A numbered list item
3. A numbered list item

```
debug.print("foo");
```

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore', 'A Place', 10, '1.000', '1.111');

insert into public.historical_events
    (user_id, slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'the-second-event', 'The Second Event', 'The second event summary.', '## The Event Header
Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga
Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.

- A list item
- A list item
- A list item

1. A numbered list item
2. A numbered list item
3. A numbered list item

```
debug.print("foo");
```

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore', 'Another Place', 10, '1.111', '1.222');

insert into public.historical_events
    (user_id, slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'the-third-event', 'The Third Event', 'The third event summary.', '## The Event Header
Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga
Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.

- A list item
- A list item
- A list item

1. A numbered list item
2. A numbered list item
3. A numbered list item

```
debug.print("foo");
```

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore
', 'Another Place', 10, '1.222', '1.333');

insert into categories
    (user_id, slug, title)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'first-category', 'First Category'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'second-category', 'Second Category'),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 'third-category', 'Third Category');

insert into event_categories
    (user_id, historical_event_id, category_id)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 3);

insert into timeline_events
    (user_id, timeline_id, historical_event_id)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 4, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 4, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 4, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 5, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 5, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 5, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 6, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 6, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 6, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 7, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 7, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 7, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 8, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 8, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 8, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 9, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 9, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 9, 3);

insert into period_timelines
    (user_id, period_id, timeline_id)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 3),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 4),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 5),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 2, 6),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 7),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 8),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 3, 9);

insert into story_periods
    (user_id, story_id, period_id)
values
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 1),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 2),
    ('cb1d95e6-076d-4328-856e-912fa4227fb0', 1, 3);