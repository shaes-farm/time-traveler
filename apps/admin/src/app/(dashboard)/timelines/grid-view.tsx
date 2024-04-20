'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { Timeline } from 'service';
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
    name: 'scale',
    label: 'Scale',
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
  timelines: Timeline[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export default function GridView({ timelines, createLink, deleteLink, editLink }: GridViewProps): JSX.Element {
  return (
    <ContentViewer
      count={timelines.length}
      createLink={createLink}
      model={{plural: 'Timelines', singular: 'Timeline'}}
    >
      <ItemTable
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={timelines}
        title="All Timelines"
      />
    </ContentViewer>
  );
}
