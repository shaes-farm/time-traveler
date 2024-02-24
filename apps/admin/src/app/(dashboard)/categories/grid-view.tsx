'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from 'service';
import { ContentViewer, GridList } from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    headerName: 'Slug',
    width: 300,
    editable: true,
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 300,
    editable: true,
  },
];

interface GridViewProps {
  categories: Category[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export default function GridView({ categories, createLink, deleteLink, editLink }: GridViewProps): JSX.Element {
  return (
    <ContentViewer
      count={categories.length}
      createLink={createLink}
      title="Categories"
    >
      <GridList
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={categories}
      />
    </ContentViewer>
  );
}
