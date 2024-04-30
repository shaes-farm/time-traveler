'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Media } from 'service';
import { GridList } from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    flex: 3,
    headerName: 'Slug',
    width: 150,
  },
  {
    field: 'alternativetext',
    flex: 2,
    headerName: 'Title',
    hideable: false,
    width: 150,
  },
  {
    field: 'caption',
    flex: 2,
    headerName: 'Caption',
    width: 150,
  },
  {
    field: 'url',
    flex: 2,
    headerName: 'Source',
    width: 150,
  },
  {
    field: 'width',
    flex: 1,
    headerName: 'Width',
    width: 75,
  },
  {
    field: 'height',
    flex: 1,
    headerName: 'Height',
    width: 75,
  },
  {
    field: 'formats',
    flex: 1,
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

export function MediaListView({ media, deleteLink, editLink }: MediaListViewProps): JSX.Element {
  return (
    <GridList
      columns={columns}
      deleteLink={deleteLink}
      editLink={editLink}
      rows={media.map((item) => ({ title: item.alternativeText ?? '', ...item }))}
    />
  );
}
