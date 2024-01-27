'use client';
import Box from '@mui/material/Box';
import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import type { Category } from 'service';

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
];

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps): JSX.Element {
  return (
    <Box sx={{ mt: '3em', height: 400, width: '100%' }}>
      <DataGrid
        checkboxSelection
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(row: Category) => row.slug}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        rows={categories}
      />
    </Box>
  );
}
