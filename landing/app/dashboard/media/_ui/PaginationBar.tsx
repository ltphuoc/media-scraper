'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  totalPages: number
  onChange: (newPage: number) => void
}

export default function PaginationBar({ page, totalPages, onChange }: Props) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    const sidePages = 2

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)

    const start = Math.max(2, page - sidePages)
    const end = Math.min(totalPages - 1, page + sidePages)

    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')

    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Go to previous page"
        className="p-1 rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex gap-3 flex-wrap justify-center">
        {pageNumbers.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-muted-foreground" aria-hidden="true">
                ...
              </span>
            )
          }

          const pageNum = p as number
          const isActive = pageNum === page

          return (
            <button
              key={pageNum}
              onClick={() => onChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              className={`my-auto size-8 rounded-md text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'border-input bg-background text-foreground hover:bg-muted cursor-pointer'
              }`}
            >
              {pageNum}
            </button>
          )
        })}
      </div>

      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Go to next page"
        className="p-1 rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
