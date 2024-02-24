'use client';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import type {
  GridColDef,
  GridRowId,
} from '@mui/x-data-grid';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
} from '@mui/x-data-grid';

interface GridListRow {
    slug: string;
}

interface GridListProps {
  columns: GridColDef[];
  rows: GridListRow[];
  deleteLink: string;
  editLink: string;
}

export function GridList({ columns, rows, deleteLink, editLink }: GridListProps): JSX.Element {
  const router = useRouter();

  const handleEditClick = (id: GridRowId) => () => {
    router.push(editLink.replace('[slug]', id.toString()));
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    router.push(deleteLink.replace('[slug]', id.toString()));
  };

  const columnDef = columns.concat([{
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 100,
    cellClassName: 'actions',
    getActions: ({ id }) => {
      return [
        <GridActionsCellItem
          className="textPrimary"
          color="inherit"
          icon={<EditIcon />}
          key="action-cell-edit"
          label="Edit"
          onClick={handleEditClick(id)}
        />,
        <GridActionsCellItem
          color="inherit"
          icon={<DeleteIcon />}
          key="action-cell-delete"
          label="Delete"
          onClick={handleDeleteClick(id)}
        />,
      ];
    }
  }]);

  return (
    <Box sx={{ mt: '3em', width: '100%' }}>
      <DataGrid
        columns={columnDef}
        getRowId={(row: GridListRow) => row.slug}
        rows={rows}
        slots={{
          toolbar: GridToolbar,
        }}
      />
    </Box>
  );
}
