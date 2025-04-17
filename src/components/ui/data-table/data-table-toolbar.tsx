"use client";

import { type Table } from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import { Hash, TrashIcon } from "lucide-react";
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
import { Calendar } from "../calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import type { DateRange } from "react-day-picker";

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
                placeholder={filter.placeholder ?? `Filter ${filter.label}...`}
                value={
                  (table.getColumn(filter.id)?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  handleFilterChange(filter.id, event.target.value)
                }
                className={cn(
                  "text-muted-foreground focus:text-foreground h-8 w-[150px] bg-white font-light lg:w-[250px]",
                  filter.className,
                )}
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
                <SelectTrigger className="!h-8 w-fit bg-white font-light">
                  <SelectValue
                    placeholder={
                      filter.placeholder ??
                      `Filter ${filter.label.toLowerCase()}...`
                    }
                  />
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
                placeholder={
                  filter.placeholder ??
                  `Filter ${filter.label.toLowerCase()}...`
                }
                onSearchChange={(search) => filter.onSearchChange?.(search)}
                loading={filter.loading}
              />
            );
          }

          if (filter.type === "date") {
            const value = table.getColumn(filter.id)?.getFilterValue() as
              | { from?: number; to?: number }
              | undefined;

            return (
              <Popover key={filter.id}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 w-fit justify-start text-left font-light",
                      !value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value
                      ? dayjs(value.from).format("MM/DD/YYYY") +
                        " - " +
                        dayjs(value.to).format("MM/DD/YYYY")
                      : (filter.placeholder ??
                        `Filter ${filter.label.toLowerCase()}...`)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={
                      value
                        ? {
                            from: value.from ? new Date(value.from) : undefined,
                            to: value.to ? new Date(value.to) : undefined,
                          }
                        : undefined
                    }
                    onSelect={(date: DateRange | undefined) =>
                      handleFilterChange(filter.id, {
                        from: date?.from?.getTime(),
                        to: date?.to?.getTime(),
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            );
          }

          if (filter.type === "number") {
            const value = table.getColumn(filter.id)?.getFilterValue() as
              | { from?: number; to?: number }
              | undefined;

            return (
              <Popover key={filter.id}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 w-fit justify-start text-left font-light",
                      !value?.from && !value?.to && "text-muted-foreground",
                    )}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    {value?.from || value?.to ? (
                      <>
                        {filter.label}: {value.from ?? "0"} - {value.to ?? "∞"}
                      </>
                    ) : (
                      `Filter ${filter.label}...`
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={`Min`}
                      value={value?.from ?? ""}
                      onChange={(event) =>
                        handleFilterChange(filter.id, {
                          ...value,
                          from: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      className="h-8 w-[80px]"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="number"
                      placeholder={`Max`}
                      value={value?.to ?? ""}
                      onChange={(event) =>
                        handleFilterChange(filter.id, {
                          ...value,
                          to: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      className="h-8 w-[80px]"
                    />
                  </div>
                </PopoverContent>
              </Popover>
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
