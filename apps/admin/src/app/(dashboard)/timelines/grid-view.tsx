'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Timeline } from 'service';
import {ContentViewer, GridList} from '../../../components';

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
    field: 'scale',
    headerName: 'Scale',
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
      title="Timelines"
    >
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={timelines}
      />
    </ContentViewer>
  );
}
