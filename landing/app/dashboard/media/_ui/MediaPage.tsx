'use client'

import { apiService, MediaType } from '@/lib/api.service'
import useFilterQueryString from '@/lib/hooks/useFilterQueryString'
import { MODE, SEARCH_PARAMS, VIEW } from '@/lib/utils/enum'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import FilterBar from './FilterBar'
import MediaGrid from './MediaGrid'
import PaginationBar from './PaginationBar'

export default function MediaPage() {
  const { searchParams, filterQueryString } = useFilterQueryString()

  const page = Number(searchParams.get(SEARCH_PARAMS.Page)) || 1
  const limit = Number(searchParams.get(SEARCH_PARAMS.Limit)) || 12
  const type = (searchParams.get(SEARCH_PARAMS.Type) as MediaType) || undefined
  const search = searchParams.get(SEARCH_PARAMS.Search) || ''
  const mode = (searchParams.get(SEARCH_PARAMS.Mode) as MODE) || MODE.Pagination
  const view = (searchParams.get(SEARCH_PARAMS.View) as VIEW) || VIEW.Grid

  const commonParams = useMemo(() => ({ limit, type, search }), [limit, type, search])

  const {
    data: pageData,
    isLoading: isPageLoading,
    error: pageError,
  } = useQuery({
    queryKey: ['media', page, ...Object.values(commonParams)],
    queryFn: () => apiService.getMedia({ page, ...commonParams }),
    enabled: mode === MODE.Pagination,
  })

  const {
    data: infiniteData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
    error: infiniteError,
  } = useInfiniteQuery({
    queryKey: ['media', 'infinite', ...Object.values(commonParams)],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => apiService.getMedia({ page: pageParam, ...commonParams }),
    getNextPageParam: (lastPage) =>
      lastPage.metadata.page < lastPage.metadata.totalPages ? lastPage.metadata.page + 1 : undefined,
    enabled: mode === MODE.Infinite,
  })

  const isLoading = mode === MODE.Pagination ? isPageLoading : isInfiniteLoading
  const error = mode === MODE.Pagination ? pageError : infiniteError
  const dataItems = mode === MODE.Pagination ? pageData?.data ?? [] : infiniteData?.pages.flatMap((p) => p.data) ?? []
  const metadata = pageData?.metadata ?? infiniteData?.pages?.[0]?.metadata ?? { total: 0, totalPages: 1 }

  const handleFilterChange = useCallback(
    (key: string, value?: string) => filterQueryString({ [key]: value, page: '1' }, { type: 'replace' }),
    [filterQueryString]
  )

  const handlePagination = useCallback(
    (newPage: number) => filterQueryString({ page: String(newPage) }, { type: 'replace', scroll: true }),
    [filterQueryString]
  )

  const handleResetFilters = useCallback(() => {
    filterQueryString(
      {
        [SEARCH_PARAMS.Page]: '1',
        [SEARCH_PARAMS.Limit]: '12',
        [SEARCH_PARAMS.Type]: undefined,
        [SEARCH_PARAMS.Search]: undefined,
        [SEARCH_PARAMS.Mode]: MODE.Pagination,
        [SEARCH_PARAMS.View]: VIEW.Grid,
      },
      { type: 'replace' }
    )
  }, [filterQueryString])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (mode !== MODE.Infinite || !hasNextPage || !loadMoreRef.current) return
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && fetchNextPage(), {
      threshold: 1,
    })
    const ref = loadMoreRef.current
    observer.observe(ref)
    return () => observer.unobserve(ref)
  }, [mode, hasNextPage, fetchNextPage])

  return (
    <div className="space-y-6">
      <FilterBar
        view={view}
        mode={mode}
        type={type}
        search={search}
        limit={limit}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {mode === MODE.Pagination && metadata.totalPages > 1 && !error && !isLoading && (
        <PaginationBar page={page} totalPages={metadata.totalPages} onChange={handlePagination} />
      )}

      <MediaGrid
        view={view}
        mode={mode}
        dataItems={dataItems}
        isLoading={isLoading}
        error={error}
        limit={limit}
        total={metadata.total}
        loadMoreRef={loadMoreRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />

      {mode === MODE.Pagination && metadata.totalPages > 1 && !error && !isLoading && (
        <PaginationBar page={page} totalPages={metadata.totalPages} onChange={handlePagination} />
      )}
    </div>
  )
}
