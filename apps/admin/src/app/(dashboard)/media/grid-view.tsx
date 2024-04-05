'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { Media } from 'service';
import {type ItemTableCol, ItemTable } from '../../../components';

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
    name: 'alternativeText',
    label: 'Title',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'caption',
    label: 'Caption',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'url',
    label: 'Source',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'width',
    label: 'Width',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'height',
    label: 'Height',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'formats',
    label: 'File Type',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
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
    <ItemTable
      columns={columns}
      deleteLink={deleteLink}
      editLink={editLink}
      rows={media.map((item) => ({title: item.alternativeText ?? '', ...item}))}
      title="All Media"
    />
  );
}
