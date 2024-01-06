insert into public.periods
    (slug, title, summary, begin_date, end_date)
values
    ('period-one', 'Period One', 'The first period.', '1.000', '1.999'),
    ('period-two', 'Period Two', 'The second period.', '2.000', '2.999'),
    ('period-three', 'Period Three', 'The third period.', '3.000', '3.999');

insert into public.timelines
    (slug, title, summary, scale, begin_date, end_date)
values
    ('period-one-timeline-one', 'Period One Timeline One', 'First timeline of the first period.', 'all dates are decimal numbers', '1.000', '1.333'),
    ('period-one-timeline-two', 'Period One Timeline Two', 'Second timeline of the first period.', 'all dates are decimal numbers', '1.333', '1.666'),
    ('period-one-timeline-three', 'Period One Timeline Three', 'Third timeline of the first period.', 'all dates are decimal numbers', '1.666', '1.999'),
    ('period-two-timeline-one', 'Period Two Timeline One', 'First timeline of the second period.', 'all dates are decimal numbers', '2.000', '2.333'),
    ('period-two-timeline-two', 'Period Two Timeline Two', 'Second timeline of the second period.', 'all dates are decimal numbers', '2.333', '2.666'),
    ('period-two-timeline-three', 'Period Two Timeline Three', 'Third timeline of the second period.', 'all dates are decimal numbers', '2.666', '2.999'),
    ('period-three-timeline-one', 'Period Three Timeline One', 'First timeline of the third period.', 'all dates are decimal numbers', '3.000', '3.333'),
    ('period-three-timeline-two', 'Period Three Timeline Two', 'Second timeline of the third period.', 'all dates are decimal numbers', '3.333', '3.666'),
    ('period-three-timeline-three', 'Period Three Timeline Three', 'Third timeline of the third period.', 'all dates are decimal numbers', '3.666', '3.999');

insert into public.historical_events
    (slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('the-first-event', 'The First Event', 'The first event summary.', '## The Event Header
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
debug.print(\"foo\");
```

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore', 'A Place', 10, '1.000', '1.111');

insert into public.historical_events
    (slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('the-second-event', 'The Second Event', 'The second event summary.', '## The Event Header
Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga
Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.

- A list item
- A list item
- A list item

1. A numbered list item
2. A numbered list item
3. A numbered list item

\`\`\`
debug.print(\"foo\");
\`\`\`

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore', 'Another Place', 10, '1.111', '1.222');

insert into public.historical_events
    (slug, title, summary, detail, location, importance, begin_date, end_date)
values
    ('the-third-event', 'The Third Event', 'The third event summary.', '## The Event Header
Nihil **possimus** sit <u>rerum rerum</u>. Nostrum eum sint sed illum deserunt nesciunt aut. Soluta quae et excepturi autem expedita minus numquam sapiente. Sint et suscipit ducimus nihil voluptas et.

## Aliquid Sequi Et Fuga
Eligendi similique molestias quos ~~consequatur~~ dolor rerum corporis. Deleniti ab vel qui. Quo quia praesentium corporis et nam. Et hic ut aut aperiam explicabo. Dolorem excepturi aut iure et minus. Nesciunt occaecati totam _praesentium_.

- A list item
- A list item
- A list item

1. A numbered list item
2. A numbered list item
3. A numbered list item

\`\`\`
debug.print(\"foo\");
\`\`\`

A [link](http://example.com) to nowhere.


>Quoth the Raven, Nevermore', 'Another Place', 10, '1.222', '1.333');

insert into categories
    (slug, title)
values
    ('first-category', 'First Category'),
    ('second-category', 'Second Category'),
    ('third-category', 'Third Category');

insert into event_categories
    (historical_event_id, category_id)
values
    (1, 1),
    (2, 1),
    (2, 2),
    (2, 3),
    (3, 3);

insert into timeline_events
    (timeline_id, historical_event_id)
values
    (1, 1),
    (1, 2),
    (1, 3),
    (2, 1),
    (2, 2),
    (2, 3),
    (3, 1),
    (3, 2),
    (3, 3),
    (4, 1),
    (4, 2),
    (4, 3),
    (5, 1),
    (5, 2),
    (5, 3),
    (6, 1),
    (6, 2),
    (6, 3),
    (7, 1),
    (7, 2),
    (7, 3),
    (8, 1),
    (8, 2),
    (8, 3),
    (9, 1),
    (9, 2),
    (9, 3);

insert into period_timelines
    (period_id, timeline_id)
values
    (1, 1),
    (1, 2),
    (1, 3),
    (2, 4),
    (2, 5),
    (2, 6),
    (3, 7),
    (3, 8),
    (3, 9);
