import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  total = 0,
  limit = 10,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const currentPage = Math.min(
    Math.max(1, Number(page) || 1),
    safeTotalPages
  );

  const pages = [];

  for (let pageNumber = 1; pageNumber <= safeTotalPages; pageNumber += 1) {
    if (
      pageNumber <= 5 ||
      pageNumber === safeTotalPages ||
      Math.abs(pageNumber - currentPage) <= 1
    ) {
      pages.push(pageNumber);
    } else if (pageNumber === 6 && safeTotalPages > 7) {
      pages.push("...");
    }
  }

  const uniquePages = pages.filter(
    (pageNumber, index) => pageNumber !== pages[index - 1]
  );

  const firstRecord = total
    ? Math.min((currentPage - 1) * limit + 1, total)
    : 0;
  const lastRecord = Math.min(currentPage * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {firstRecord} to {lastRecord} of {total} records
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {uniquePages.map((pageNumber, index) =>
          pageNumber === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1">
              ...
            </span>
          ) : (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`grid h-9 min-w-9 place-items-center rounded-lg border text-xs ${
                pageNumber === currentPage
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </button>
          )
        )}

        <button
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
