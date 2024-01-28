'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { HistoricalEvent } from 'service';
import {ContentViewer, GridList} from '../components';

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
    field: 'summary',
    headerName: 'Summary',
    width: 150,
  },
  {
    field: 'location',
    headerName: 'Location',
    width: 150,
  },
  {
    field: 'beginDate',
    headerName: 'Begin',
    width: 75,
  },
  {
    field: 'endDate',
    headerName: 'End',
    width: 75,
  },
];

interface EventListViewProps {
  events: HistoricalEvent[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export function EventListView({ events, createLink, deleteLink, editLink }: EventListViewProps): JSX.Element {
  return (
    <ContentViewer
      count={events.length}
      createLink={createLink}
      title="Events"
    >
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={events}
      />
    </ContentViewer>
  );
}
