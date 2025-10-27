'use client'

import { MediaType } from '@/lib/api.service'
import { MODE, SEARCH_PARAMS, VIEW } from '@/lib/utils/enum'
import { LayoutGrid, List, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

type Props = {
  view: VIEW
  mode: MODE
  type?: MediaType
  search: string
  limit: number
  onChange: (key: string, value?: string) => void
  onReset: () => void
}

export default function FilterBar({ view, mode, type, search, limit, onChange, onReset }: Props) {
  const [text, setText] = useState(search)
  const [debounced] = useDebounce(text, 500)

  useEffect(() => {
    if (debounced !== search) {
      onChange(SEARCH_PARAMS.Search, debounced)
    }
  }, [debounced, onChange, search])

  return (
    <div className="space-y-3 mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-1 sm:items-center sm:gap-3">
          <select
            value={type ?? 'all'}
            onChange={(e) => onChange(SEARCH_PARAMS.Type, e.target.value === 'all' ? undefined : e.target.value)}
            aria-label="Filter by media type"
            className="w-full sm:w-40 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All types</option>
            <option value={MediaType.Image}>Images</option>
            <option value={MediaType.Video}>Videos</option>
          </select>

          <div className="relative w-full max-w-[500px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by URL..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Search media by URL"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <select
          value={mode}
          onChange={(e) => onChange(SEARCH_PARAMS.Mode, e.target.value)}
          aria-label="Select display mode"
          className="w-full sm:w-40 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value={MODE.Pagination}>Pagination</option>
          <option value={MODE.Infinite}>Infinite Scroll</option>
        </select>

        <select
          value={String(limit)}
          onChange={(e) => onChange(SEARCH_PARAMS.Limit, e.target.value)}
          aria-label="Items per page"
          className="w-full sm:w-32 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="12">12 / page</option>
          <option value="24">24 / page</option>
          <option value="48">48 / page</option>
          <option value="100">100 / page</option>
        </select>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => onChange(SEARCH_PARAMS.View, VIEW.Grid)}
              title="Grid view"
              aria-label="Switch to grid view"
              aria-pressed={view === VIEW.Grid}
              className={`size-8 p-0 rounded transition-colors flex items-center justify-center cursor-pointer ${
                view === VIEW.Grid
                  ? 'bg-background text-blue-600 shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-blue-600'
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => onChange(SEARCH_PARAMS.View, VIEW.List)}
              title="List view"
              aria-label="Switch to list view"
              aria-pressed={view === VIEW.List}
              className={`size-8 p-0 rounded transition-colors flex items-center justify-center cursor-pointer ${
                view === VIEW.List
                  ? 'bg-background text-blue-600 shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-blue-600'
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        <button
          onClick={onReset}
          aria-label="Reset all filters and settings"
          className="w-full sm:w-auto px-3 py-2 rounded-md border border-input bg-transparent text-sm font-medium transition-colors hover:bg-blue-600 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="size-4" />
          Reset
        </button>
      </div>
    </div>
  )
}
