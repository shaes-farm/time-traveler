export default {
    name: 'event',
    type: 'document',
    title: 'Event',
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
        name: 'detail',
        title: 'Detail',
        type: 'text',
      },
      {
        name: 'location',
        title: 'Location',
        type: 'string',
      },
      {
        name: 'importance',
        title: 'Importance',
        type: 'number',
        validation: (Rule: any) => Rule.required().positive().integer(),
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
        name: 'timeline',
        title: 'Timeline',
        type: 'reference',
        to: [
          {type: 'timeline'}
        ]
      },
      {
        name: 'categories',
        title: 'Categories',
        type: 'array',
        of: [
          {type: 'category'}
        ]
      },
      {
        name: 'timelines',
        title: 'Timelines',
        type: 'array',
        of: [
          {type: 'timeline'}
        ]
      },
      {
        name: 'media',
        title: 'Media',
        type: 'string',
      },
    ]
}
