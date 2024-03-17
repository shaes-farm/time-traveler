'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Story } from 'service';
import {ContentViewer, GridList} from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    headerName: 'Slug',
    width: 150,
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 150,
  },
  {
    field: 'subTitle',
    headerName: 'Sub-Title',
    width: 150,
  },
  {
    field: 'summary',
    headerName: 'Summary',
    width: 150,
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
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={stories}
      />
    </ContentViewer>
  );
}
