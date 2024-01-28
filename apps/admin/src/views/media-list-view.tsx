'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Media } from 'service';
import {ContentViewer, GridList} from '../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    headerName: 'Slug',
    width: 150,
  },
  {
    field: 'alternativetext',
    headerName: 'Alt Text',
    width: 150,
  },
  {
    field: 'caption',
    headerName: 'Caption',
    width: 150,
  },
  {
    field: 'url',
    headerName: 'Source',
    width: 150,
  },
  {
    field: 'width',
    headerName: 'Width',
    width: 75,
  },
  {
    field: 'height',
    headerName: 'Height',
    width: 75,
  },
  {
    field: 'formats',
    headerName: 'Formats',
    width: 100,
  },
];

interface MediaListViewProps {
  media: Media[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export function MediaListView({ media, createLink, deleteLink, editLink }: MediaListViewProps): JSX.Element {
  return (
    <ContentViewer
      count={media.length}
      createLink={createLink}
      title="Media"
    >
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={media}
      />
    </ContentViewer>
  );
}
