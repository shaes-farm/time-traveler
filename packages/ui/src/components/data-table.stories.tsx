import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";
import { DataTable, createSelectColumn } from "./data-table";
import { StatusBadge } from "./status-badge";

interface CharacterRow {
  id: string;
  name: string;
  type: string;
  era: string;
  status: "published" | "draft" | "shared";
  events: number;
}

const rows: CharacterRow[] = [
  {
    id: "1",
    name: "Marie Curie",
    type: "Human",
    era: "CE",
    status: "published",
    events: 12,
  },
  {
    id: "2",
    name: "Ra",
    type: "Mythological",
    era: "BCE",
    status: "published",
    events: 8,
  },
  {
    id: "3",
    name: "Don Quixote",
    type: "Fictional",
    era: "CE",
    status: "draft",
    events: 5,
  },
];

const columns: ColumnDef<CharacterRow>[] = [
  createSelectColumn<CharacterRow>(),
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="text-xs">
        {getValue() as string}
      </Badge>
    ),
  },
  {
    accessorKey: "era",
    header: "Era",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-foreground-muted">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() as CharacterRow["status"]} />
    ),
  },
  {
    accessorKey: "events",
    header: "Events",
    cell: ({ getValue }) => (
      <span className="tabular-nums text-foreground-muted">
        {getValue() as number}
      </span>
    ),
  },
];

const meta = {
  title: "Components/DataTable",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ClickableTable() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={rows}
        onRowClick={(row) => setSelectedId(row.id)}
      />
      <p className="text-sm text-foreground-muted">
        Selected row: {selectedId ?? "None"}
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <DataTable columns={columns} data={rows} />,
};

export const RowClick: Story = {
  render: () => <ClickableTable />,
};

export const EmptyState: Story = {
  render: () => <DataTable columns={columns} data={[]} />,
};
