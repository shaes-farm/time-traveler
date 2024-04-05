'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { HistoricalEvent } from 'service';
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
    name: 'summary',
    label: 'Summary',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'location',
    label: 'Location',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'beginDate',
    label: 'Begin Date',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'endDate',
    label: 'End Date',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
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
      title="Events"
    >
      <ItemTable
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={events}
        title="All Events"
      />
    </ContentViewer>
  );
}
