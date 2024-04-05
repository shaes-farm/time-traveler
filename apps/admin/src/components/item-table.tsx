/* eslint-disable @typescript-eslint/no-unsafe-assignment -- MUIDataTable is forked */
'use client';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MUIDataTable from "mui-datatables";
import type { MUIDataTableColumnDef } from "mui-datatables";

export interface ItemTableRow {
  slug: string;
  title: string;
}

export interface ItemTableColOptions {
  display?: boolean;
  download?: boolean;
  filter?: boolean;
  filterType?: 'checkbox' | 'dropdown' | 'mltiselect' | 'textField' | 'custom';
  hint?: string;
  print?: string;
  searchable?: boolean;
  sort?: boolean;
  viewColumns?: boolean;
}

// export interface ItemTableCol {
//   name: string;
//   label: string;
//   options?: ItemTableColOptions;
// }

export type ItemTableCol = MUIDataTableColumnDef;

export interface ItemTableOptions {
  elevation?: number;
  filter?: boolean | 'disabled';
  filterType?: 'checkbox' | 'dropdown' | 'mltiselect' | 'textField' | 'custom';
  search?: boolean | 'disabled';
  selectableRows?: 'multiple' | 'single';
  selectableRowsHeader?: boolean;
  sort?: boolean;
  viewColumns?: boolean | 'disabled';
}

interface ActionsColumnProps {
  onEdit: () => void;
  onDelete: () => void;
}

function ActionsColumn({onDelete, onEdit }: ActionsColumnProps): JSX.Element {
  return (
    <Stack direction="row" spacing={0}>
      <IconButton onClick={onEdit} size="small">
        <EditIcon />
      </IconButton>
      <IconButton onClick={onDelete} size="small">
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}

interface ItemTableProps {
  title: React.ReactNode;
  columns: ItemTableCol[];
  rows: ItemTableRow[];
  deleteLink: string;
  editLink: string;
}

export function ItemTable({ title, columns, rows, deleteLink, editLink }: ItemTableProps): JSX.Element {
  const router = useRouter();

  const handleEdit = (name: string) => () => {
    const url = editLink.replace('[slug]', name.toString());
    router.push(url);
  };

  const handleDelete = (name: string) => () => {
    const url = deleteLink.replace('[slug]', name.toString());
    router.push(url);
  };

  const columnDef = columns.concat([{
    name: "Actions",
    options: {
      filter: false,
      sort: false,
      empty: true,
      customBodyRenderLite: (dataIndex, _rowIndex) => (
        <ActionsColumn
          onDelete={handleDelete(rows[dataIndex].slug)}
          onEdit={handleEdit(rows[dataIndex].slug)}
        />
      ),
    }
  }]);

  return (
    <Box m="1rem">
      <MUIDataTable
        columns={columnDef}
        data={rows}
        options={{
          elevation: 0,
          filterType: 'checkbox',
          responsive: 'standard',
          selectableRows: 'none',
          selectableRowsHeader: false,
          selectableRowsHideCheckboxes: true,
          selectableRowsOnClick: true,
        }}
        title={<Typography variant="h2">{title}</Typography>}
      />
    </Box>
  );
}
