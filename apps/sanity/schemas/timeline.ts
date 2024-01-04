export default {
    name: 'timeline',
    type: 'document',
    title: 'Timeline',
    fields: [
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96,
          auto: true,
        }
      },
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'summary',
        title: 'Summary',
        type: 'text',
      },
      {
        name: 'scale',
        title: 'Scale',
        type: 'string',
      },
      {
        name: 'beginDate',
        title: 'Begin Date',
        type: 'string',
      },
      {
        name: 'endDate',
        title: 'End Date',
        type: 'string',
      },
      {
        name: 'events',
        title: 'Events',
        type: 'array',
        of: [
          {type: 'event'}
        ]
      },
      {
        name: 'periods',
        title: 'Periods',
        type: 'array',
        of: [
          {type: 'period'}
        ]
      },
    ]
};
