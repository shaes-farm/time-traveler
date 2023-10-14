import type {Timeline} from 'service';

export const timeline: Timeline = {
  slug: 'a-timeline',
  title: 'A Timeline',
  summary: 'A demonstration timeline used as filler for the story. Est culpa qui qui tempore ex qui quis. Consequatur et laborum quia. Magnam voluptas delectus laudantium molestiae. Assumenda dolorem aliquid et possimus atque repellat illo. Molestiae repellat delectus consequatur numquam ipsa nisi. Excepturi doloribus laudantium laboriosam et consequatur aperiam doloremque.',
  scale: 'The timeline scale (1:1,000,000)',
  periods: [{
    slug: 'a-time-period',
    title: 'A Time Period',
    beginDate: '1234',
    timelines: []
  }],
  events: [{
    slug: 'an-event',
    title: 'An event',
    summary: 'An event summary',
    categories: [],
    location: 'Somewhere',
    importance: 10,
    beginDate: '1234',
    endDate: '1235',
    timelines: [],
    media: [],
  },{
    slug: 'another-event',
    title: 'Another event',
    summary: 'Another event summary',
    categories: [],
    location: 'Somewhere Else',
    importance: 5,
    beginDate: '1235',
    endDate: '1236',
    timelines: [],
    media: [],
  },{
    slug: 'yet-another-event',
    title: 'Yet Another event',
    summary: 'Yet another event summary',
    categories: [],
    location: 'Somewhere Different',
    importance: 8,
    beginDate: '1236',
    endDate: '1237',
    timelines: [],
    media: [],
  }],
};