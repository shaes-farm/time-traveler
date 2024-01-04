export default {
    name: 'period',
    type: 'document',
    title: 'Period',
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
        name: 'timelines',
        title: 'Timelines',
        type: 'array',
        of: [{
          type: 'reference',
          to: [{type: 'timeline'}],
        }],
      },
    ]
};
