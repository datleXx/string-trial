import { Button } from "~/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationControlsProps {
  page: number;
  setPage: (value: number | ((prevPage: number) => number)) => void;
  total_pages: number;
  loading: boolean;
}

export function PaginationControls({
  page,
  setPage,
  total_pages,
  loading,
}: PaginationControlsProps) {
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const show_ellipsis = total_pages > 7;

    if (show_ellipsis) {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(total_pages);
      } else if (page >= total_pages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = total_pages - 4; i <= total_pages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("...");
        pages.push(total_pages);
      }
    } else {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className="mt-5 flex w-full items-center justify-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setPage(1)}
        disabled={page === 1 || loading}
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1 || loading}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-0.5 flex gap-0.5">
        {renderPageNumbers().map((page_num, idx) =>
          page_num === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="text-muted-foreground flex items-center px-1 text-xs"
            >
              ...
            </span>
          ) : (
            <Button
              key={page_num}
              variant={page === page_num ? "default" : "ghost"}
              size="icon"
              className="h-6 w-6 text-xs"
              onClick={() => setPage(page_num as number)}
              disabled={loading}
            >
              {page_num}
            </Button>
          ),
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setPage((p) => Math.min(total_pages, p + 1))}
        disabled={page === total_pages || loading}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setPage(total_pages)}
        disabled={page === total_pages || loading}
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
