'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Timeline } from 'service';
import { ContentViewer, GridList } from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    flex: 3,
    headerName: 'Slug',
    minWidth: 150,
  },
  {
    field: 'title',
    flex: 3,
    headerName: 'Title',
    hideable: false,
    minWidth: 150,
  },
  {
    field: 'summary',
    flex: 4,
    headerName: 'Summary',
    width: 150,
  },
  {
    field: 'scale',
    flex: 2,
    headerName: 'Scale',
    width: 150,
  },
  {
    field: 'beginDate',
    flex: 1,
    headerName: 'Begin',
    type: 'number',
    width: 75,
  },
  {
    field: 'endDate',
    flex: 1,
    headerName: 'End',
    type: 'number',
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
      model={{plural: 'Timelines', singular: 'Timeline'}}
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
