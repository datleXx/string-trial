"use client";

import { type Table } from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { TrashIcon } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { type ColumnFiltersState } from "@tanstack/react-table";
import { type FilterMeta } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Combobox } from "../combobox";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filter_meta?: FilterMeta[];
  onFilterChange?: Dispatch<SetStateAction<ColumnFiltersState>>;
}

export function DataTableToolbar<TData>({
  table,
  filter_meta,
  onFilterChange,
}: DataTableToolbarProps<TData>) {
  const is_filtered = table.getState().columnFilters.length > 0;

  const handleFilterChange = (id: string, value: unknown) => {
    if (!onFilterChange) return;

    onFilterChange((prev) => {
      const existing_filter = prev.find((filter) => filter.id === id);
      if (existing_filter) {
        return prev.map((filter) =>
          filter.id === id ? { ...filter, value } : filter,
        );
      }
      return [...prev, { id, value }];
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filter_meta?.map((filter) => {
          if (filter.type === "text") {
            return (
              <Input
                key={filter.id}
                placeholder={`Filter ${filter.label}...`}
                value={
                  (table.getColumn(filter.id)?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  handleFilterChange(filter.id, event.target.value)
                }
                className="h-8 w-[150px] lg:w-[250px]"
              />
            );
          }

          if (filter.type === "select" && filter.options) {
            return (
              <Select
                key={filter.id}
                value={
                  (table.getColumn(filter.id)?.getFilterValue() as string) ?? ""
                }
                onValueChange={(value) => handleFilterChange(filter.id, value)}
              >
                <SelectTrigger className="h-8 w-fit bg-white font-light">
                  <SelectValue placeholder={`Filter ${filter.label}...`} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem
                      key={option.value.toString()}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          if (filter.type === "dropdown") {
            return (
              <Combobox
                key={filter.id}
                options={filter.options ?? []}
                value={
                  (table.getColumn(filter.id)?.getFilterValue() as string) ?? ""
                }
                className={filter.className}
                onChange={(value) => handleFilterChange(filter.id, value)}
                placeholder={`Filter ${filter.label}...`}
                onSearchChange={(search) => filter.onSearchChange?.(search)}
                loading={filter.loading}
              />
            );
          }
        })}
        {is_filtered && (
          <div
            onClick={() => table.resetColumnFilters()}
            className="flex w-fit cursor-pointer items-center justify-center gap-1 rounded-full border-1 border-red-500 px-1.5 py-0.5 hover:bg-red-50"
          >
            <TrashIcon className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500 hover:font-medium">Reset</p>
          </div>
        )}
      </div>
    </div>
  );
}
