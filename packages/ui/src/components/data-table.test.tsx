import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "./badge";
import { DataTable, createSelectColumn } from "./data-table";
import { StatusBadge } from "./status-badge";

interface RowData {
  id: string;
  name: string;
  status: "published" | "draft";
  count: number;
}

const ROWS: RowData[] = [
  { id: "2", name: "Zed", status: "draft", count: 2 },
  { id: "1", name: "Ada", status: "published", count: 10 },
];

const COLUMNS: ColumnDef<RowData>[] = [
  createSelectColumn<RowData>(),
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() as RowData["status"]} />
    ),
  },
  {
    accessorKey: "count",
    header: "Count",
    cell: ({ getValue }) => (
      <Badge variant="outline">{getValue() as number}</Badge>
    ),
  },
];

describe("DataTable", () => {
  it("renders an empty-state row when there is no data", () => {
    render(<DataTable columns={COLUMNS} data={[]} />);

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("sorts rows when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} data={ROWS} />);

    await user.click(screen.getByRole("button", { name: /name/i }));

    const [headerRow, firstBodyRow, secondBodyRow] = screen.getAllByRole("row");
    expect(headerRow).toBeInTheDocument();
    expect(within(firstBodyRow!).getByText("Ada")).toBeInTheDocument();
    expect(within(secondBodyRow!).getByText("Zed")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is selected and keeps selection controls in place", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(<DataTable columns={COLUMNS} data={ROWS} onRowClick={onRowClick} />);

    await user.click(screen.getByText("Ada"));
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
    );

    expect(
      screen.getByRole("checkbox", { name: /select all/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("checkbox", { name: /select row/i }),
    ).toHaveLength(2);
  });
});
