'use client';
import Box from '@mui/material/Box';
import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import type { Media } from 'service';

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
    field: 'location',
    headerName: 'Location',
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

interface MediaListProps {
  media: Media[];
}

export function MediaList({ media }: MediaListProps): JSX.Element {
  return (
    <Box sx={{ mt: '3em', height: 400, width: '100%' }}>
      <DataGrid
        checkboxSelection
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(row: Media) => row.slug}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        rows={media}
      />
    </Box>
  );
}
