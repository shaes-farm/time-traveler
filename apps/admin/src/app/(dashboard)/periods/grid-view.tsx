'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { Period } from 'service';
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
      title="Periods"
    >
      <ItemTable
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={periods}
        title="All Periods"
      />
    </ContentViewer>
  );
}
