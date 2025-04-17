"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { DataTableToolbar } from "./data-table-toolbar";
import { useState, useEffect } from "react";
import { type DataTableProps } from "./types";
import { PaginationControls } from "~/app/_components/PaginationControls";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableRowSkeletonTanStack } from "../skeleton";
import { Card } from "../card";

export function DataTable<TData>({
  columns,
  data,
  filter_meta,
  page_count,
  current_page,
  columnFilters,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  isLoading,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (onSortingChange) {
      onSortingChange(sorting);
    }
  }, [sorting, onSortingChange]);

  const table = useReactTable({
    data,
    columns,
    pageCount: page_count,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: onFilterChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filter_meta={filter_meta}
        onFilterChange={onFilterChange}
      />

    <Card className="p-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b bg-gray-50/50">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-3 py-2 text-sm font-semibold text-gray-900 ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:bg-gray-100"
                        : ""
                    }`}
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <div className="h-4 w-4 text-gray-500">
                            {header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        {isLoading ? (
          <TableRowSkeletonTanStack columns={columns} />
        ) : (
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b transition-colors hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 py-2 text-sm text-gray-700"
                      style={{ maxWidth: cell.column.columnDef.size }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-gray-500"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
        </Table>
      </Card>

      <PaginationControls
        page={current_page}
        setPage={onPaginationChange}
        total_pages={page_count}
        loading={isLoading ?? false}
      />
    </div>
  );
}
