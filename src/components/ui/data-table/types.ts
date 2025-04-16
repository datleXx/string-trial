import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import type { Dispatch } from "react";
import type { SetStateAction } from "react";

export type SortingState = {
  id: string;
  desc: boolean;
}[];

export type FilterMeta = {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "dropdown";
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  className?: string;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
};

export type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  filter_meta?: FilterMeta[];
  page_count: number;
  page_size?: number;
  current_page: number;
  columnFilters: ColumnFiltersState;
  onPaginationChange: (value: number | ((prevPage: number) => number)) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilterChange?: Dispatch<SetStateAction<ColumnFiltersState>>;
  isLoading?: boolean;
};
