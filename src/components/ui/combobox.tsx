"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useState } from "react";

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  onSearchChange,
  loading,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between font-light"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : (placeholder ?? "Select...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            autoComplete="on"
            className="font-light"
            placeholder={placeholder ?? "Search..."}
            value={search}
            onValueChange={(search) => {
              setSearch(search);
              onSearchChange?.(search);
            }}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                "No results found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(current_value) => {
                    const selected_option = options.find(
                      (opt) => opt.label === current_value,
                    );
                    onChange(selected_option?.value ?? "");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
