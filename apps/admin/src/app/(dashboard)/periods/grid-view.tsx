'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Period } from 'service';
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
    flex: 4,
    headerName: 'Summary',
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

interface PeriodGridViewProps {
  periods: Period[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export default function PeriodGridView({ periods, createLink, deleteLink, editLink }: PeriodGridViewProps): JSX.Element {
  return (
    <ContentViewer
      count={periods.length}
      createLink={createLink}
      model={{plural: 'Periods', singular: 'Period'}}
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
