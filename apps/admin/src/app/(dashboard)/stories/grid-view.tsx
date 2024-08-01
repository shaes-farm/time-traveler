'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Story } from 'service';
import { ContentViewer, GridList } from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    flex: 3,
    headerName: 'Slug',
    width: 150,
  },
  {
    field: 'title',
    flex: 3,
    headerName: 'Title',
    hideable: false,
    width: 150,
  },
  {
    field: 'subTitle',
    flex: 3,
    headerName: 'Sub-Title',
    width: 150,
  },
  {
    field: 'summary',
    flex: 4,
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
      model={{plural: 'Stories', singular: 'Story'}}
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
