'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { Story } from 'service';
import { ContentViewer, type ItemTableCol, ItemTable } from '../../../components';

const columns: ItemTableCol[] = [
  {
    name: 'slug',
    label: 'Slug',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'title',
    label: 'Title',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'subTitle',
    label: 'Sub-Title',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'summary',
    label: 'Summary',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
];

interface StoryGridViewProps {
  stories: Story[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export default function StoryGridView({ stories, createLink, deleteLink, editLink }: StoryGridViewProps): JSX.Element {
  return (
    <ContentViewer
      count={stories.length}
      createLink={createLink}
      title="Stories"
    >
      <ItemTable
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={stories}
        title="All Stories"
      />
    </ContentViewer>
  );
}
