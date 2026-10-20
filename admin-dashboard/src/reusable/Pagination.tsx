"use client";

import React from "react";

interface PaginationProps {
  page?: number;
  limit?: number;
  total?: number;
  currentCount?: number;
  onPageChange?: (page: number) => void;
  disabled?: boolean;
}

function Pagination({
  page = 1,
  limit = 10,
  total = 0,
  currentCount = 0,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startItem = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const fallbackCount = total === 0 ? 0 : Math.min(limit, total - startItem + 1);
  const visibleCount = currentCount > 0 ? currentCount : fallbackCount;
  const endItem = total === 0 ? 0 : Math.min(total, startItem + visibleCount - 1);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages =
    totalPages <= 4
      ? pages
      : Array.from(
          new Set([1, Math.max(1, page - 1), page, Math.min(totalPages, page + 1), totalPages]),
        ).sort((a, b) => a - b);

  const handlePageChange = (nextPage: number) => {
    if (disabled || nextPage < 1 || nextPage > totalPages || nextPage === safePage) {
      return;
    }

    onPageChange?.(nextPage);
  };

  return (
    <div className="mt-5 flex flex-col gap-4 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="font-medium">
        Showing {startItem} to {endItem} of {total} results
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          disabled={disabled || safePage <= 1}
          onClick={() => handlePageChange(safePage - 1)}
          aria-label="Go to previous page"
          className="flex h-9 w-9 items-center cursor-pointer justify-center rounded border border-neutral-700 bg-[#181818] text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600 disabled:hover:bg-[#181818]"
        >
          ‹
        </button>

        {visiblePages.map((pageNumber, index) => {
          const previousPage = visiblePages[index - 1];
          const showDots = previousPage && pageNumber - previousPage > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showDots ? <span className="px-1 text-neutral-500">...</span> : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => handlePageChange(pageNumber)}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={pageNumber === safePage ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center cursor-pointer justify-center rounded border px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                  pageNumber === safePage
                    ? "border-[#00E625] bg-[#00E625] text-black"
                    : "border-neutral-700 bg-[#181818] text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          disabled={disabled || safePage >= totalPages}
          onClick={() => handlePageChange(safePage + 1)}
          aria-label="Go to next page"
          className="flex h-9 w-9 items-center cursor-pointer justify-center rounded border border-neutral-700 bg-[#181818] text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600 disabled:hover:bg-[#181818]"
        >
          ›
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
