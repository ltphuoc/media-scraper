'use client'

import { MediaItem, MediaType } from '@/lib/api.service'
import { MODE, VIEW } from '@/lib/utils/enum'

interface Props {
  view: VIEW
  mode: MODE
  dataItems: MediaItem[]
  isLoading: boolean
  error: Error | null
  limit: number
  total: number
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
}

export default function MediaGrid({
  view,
  mode,
  dataItems,
  isLoading,
  error,
  limit,
  total,
  loadMoreRef,
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  const isGrid = view === VIEW.Grid
  const layoutClass = isGrid ? 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-3'

  if (isLoading)
    return (
      <div className={layoutClass}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={`bg-gray-100 animate-pulse rounded ${isGrid ? 'h-64' : 'h-32'}`} />
        ))}
      </div>
    )

  if (error) return <p className="text-red-600 text-center mt-4">❌ Error loading media. Please try again later.</p>

  if (!dataItems.length)
    return (
      <div className="text-center text-gray-500 mt-10">
        <p>No media found for your filters.</p>
        <p className="text-sm mt-1">Try adjusting the type or search term.</p>
      </div>
    )

  return (
    <>
      <p className="text-sm text-gray-500">
        Showing <strong>{dataItems.length}</strong> of <strong>{total}</strong> results
      </p>

      <div className={layoutClass}>
        {dataItems.map((m) => (
          <div
            key={m.id}
            className={`rounded overflow-hidden shadow bg-white hover:shadow-lg transition ${
              !isGrid && 'flex gap-4 p-3 items-center'
            }`}
          >
            {m.type === MediaType.Image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="media" className={`${isGrid ? 'w-full h-56' : 'w-32 h-32'} object-cover rounded`} />
            ) : (
              <video src={m.url} controls className={`${isGrid ? 'w-full h-56' : 'w-40 h-32'} object-cover rounded`} />
            )}
            <div className={isGrid ? 'p-2' : 'flex-1'}>
              <p className="text-xs text-gray-500 truncate">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {m.url}
                </a>
              </p>
              {!isGrid && <p className="text-xs text-gray-400 mt-1">Type: {m.type}</p>}
            </div>
          </div>
        ))}
      </div>

      {mode === MODE.Infinite && hasNextPage && (
        <div ref={loadMoreRef} className="text-center py-6 text-gray-500">
          {isFetchingNextPage ? 'Loading more...' : 'Scroll to load more ↓'}
        </div>
      )}
    </>
  )
}
