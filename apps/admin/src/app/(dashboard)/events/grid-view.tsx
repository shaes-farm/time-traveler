'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { HistoricalEvent } from 'service';
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
    field: 'summary',
    flex: 2,
    headerName: 'Summary',
    width: 150,
  },
  {
    field: 'location',
    flex: 2,
    headerName: 'Location',
    width: 150,
  },
  {
    field: 'beginDate',
    flex: 1,
    headerName: 'Begin',
    width: 75,
  },
  {
    field: 'endDate',
    flex: 1,
    headerName: 'End',
    width: 75,
  },
];

interface GridViewProps {
  events: HistoricalEvent[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export default function GridView({ events, createLink, deleteLink, editLink }: GridViewProps): JSX.Element {
  return (
    <ContentViewer
      count={events.length}
      createLink={createLink}
      model={{plural: 'Events', singular: 'Event'}}
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
