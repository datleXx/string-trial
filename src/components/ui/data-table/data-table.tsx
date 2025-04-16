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

      <Table className="!rounded-md border bg-white p-3">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <div className="h-3 w-3">
                            {header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3" />
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>

      <PaginationControls
        page={current_page}
        setPage={onPaginationChange}
        total_pages={page_count}
        loading={isLoading ?? false}
      />
    </div>
  );
}
