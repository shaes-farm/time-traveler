'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Period } from 'service';
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
    editable: true,
  },
  {
    field: 'summary',
    headerName: 'Summary',
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

interface PeriodListViewProps {
  periods: Period[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export function PeriodListView({ periods, createLink, deleteLink, editLink }: PeriodListViewProps): JSX.Element {
  return (
    <ContentViewer
      count={periods.length}
      createLink={createLink}
      title="Periods"
    >
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={periods}
      />
    </ContentViewer>
  );
}
