'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from 'service';
import { ContentViewer, GridList } from '../components';

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

interface CategoryListViewProps {
  categories: Category[];
  createLink: string;
  deleteLink: string;
  editLink: string;
}

export function CategoryListView({ categories, createLink, deleteLink, editLink }: CategoryListViewProps): JSX.Element {
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
