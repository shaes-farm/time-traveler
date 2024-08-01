/* eslint-disable import/no-named-as-default -- MUIDataTable typescript issue */
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MUIDataTable from 'mui-datatables';
import type { MUIDataTableColumnDef } from 'mui-datatables';

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

export type ItemTableCol = MUIDataTableColumnDef;

export interface ItemTableOptions {
  elevation?: number;
  filter?: boolean | 'disabled';
  filterType?: 'checkbox' | 'dropdown' | 'multiselect' | 'textfield' | 'custom';
  search?: boolean | 'disabled';
  selectableRows?: 'multiple' | 'single';
  selectableRowsHeader?: boolean;
  sort?: boolean;
  viewColumns?: boolean | 'disabled';
}

interface DeleteColumnProps {
  onDelete: () => void;
}

function DeleteColumn({ onDelete }: DeleteColumnProps): JSX.Element {
  return (
    <IconButton onClick={onDelete} size="small">
      <DeleteIcon />
    </IconButton>
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
  const [selectedRow, setSelectedRow] = useState<number|undefined>();
  const router = useRouter();

  useEffect(() => {
    if (selectedRow !== undefined) {
      handleEdit(rows[selectedRow].slug);
      setSelectedRow(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only render when selectedRow changes
  }, [selectedRow]);

  const handleEdit = (slug: string): void => {
    const url = editLink.replace('[slug]', slug.toString());
    router.push(url);
  };

  const handleDelete = (slug: string): void => {
    const url = deleteLink.replace('[slug]', slug.toString());
    router.push(url);
  };

  const columnDef = columns.concat([{
    name: "Delete",
    options: {
      filter: false,
      sort: false,
      empty: true,
      // eslint-disable-next-line react/no-unstable-nested-components -- allow component here
      customBodyRenderLite: (dataIndex, _rowIndex) => (
        <DeleteColumn
          onDelete={(): void => {handleDelete(rows[dataIndex].slug)}}
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
          onCellClick: (_colData: unknown, cellMeta: { colIndex: number, rowIndex: number, dataIndex: number }): void => {
            if (cellMeta.colIndex < columns.length) {
              setSelectedRow(cellMeta.dataIndex);
            }
          },
          // selectableRowsOnClick: false,
          // onRowClick: (_rowData: string[], rowMeta: { dataIndex: number, rowIndex: number }): void => {
          //   setSelectedRow(rowMeta.dataIndex);
          // },          
        }}
        title={<Typography variant="h2">{title}</Typography>}
      />
    </Box>
  );
}
