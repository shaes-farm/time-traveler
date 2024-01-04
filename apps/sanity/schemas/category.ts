// import {defineType, defineField, defineArrayMember} from 'sanity';

export default {
    name: 'category',
    title: 'Category',
    type: 'document',
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
        name: 'events',
        title: 'Events',
        type: 'array',
        of: [{
          type: 'reference',
          to: [{type: 'event'}],
        }],
      },
    ]
};
