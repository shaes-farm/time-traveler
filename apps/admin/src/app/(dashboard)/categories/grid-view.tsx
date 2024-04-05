'use client';
// import type { GridColDef } from '@mui/x-data-grid';
import type { Category } from 'service';
import { ContentViewer, type ItemTableCol, ItemTable } from '../../../components';

const columns: ItemTableCol[] = [
  {
    name: 'slug',
    label: 'Slug',
    options: {
      display: false,
      filter: true,
      sort: true,
    }
  },
  {
    name: 'title',
    label: 'Title',
    options: {
      display: true,
      filter: true,
      sort: true,
    }
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
      <ItemTable
        columns={columns}
        deleteLink={deleteLink}
        editLink={editLink}
        rows={categories}
        title="All Categories"
      />
    </ContentViewer>
  );
}
