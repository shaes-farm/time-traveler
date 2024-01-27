'use client';
import Box from '@mui/material/Box';
import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import type { Timeline } from 'service';

const columns: GridColDef[] = [
  {
    field: 'slug',
    headerName: 'Slug',
    width: 150,
    editable: true,
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
    editable: true,
  },
  {
    field: 'scale',
    headerName: 'Scale',
    width: 150,
    editable: true,
  },
  {
    field: 'beginDate',
    headerName: 'Begin',
    width: 150,
    editable: true,
  },
  {
    field: 'endDate',
    headerName: 'End',
    width: 150,
    editable: true,
  },
];

interface TimelineListProps {
  timelines: Timeline[];
}

export function TimelineList({ timelines }: TimelineListProps): JSX.Element {
  return (
    <Box sx={{ mt: '3em', height: 400, width: '100%' }}>
      <DataGrid
        checkboxSelection
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(row: Timeline) => row.slug}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        rows={timelines}
      />
    </Box>
  );
}
