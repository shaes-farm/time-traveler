'use client';
import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from 'service';
import { ContentViewer, GridList } from '../../../components';

const columns: GridColDef[] = [
  {
    field: 'slug',
    flex: 3,
    headerName: 'Slug',
    width: 300,
  },
  {
    field: 'title',
    flex: 3,
    headerName: 'Title',
    hideable: false,
    width: 300,
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
      model={{plural: 'Categories', singular: 'Category'}}
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
