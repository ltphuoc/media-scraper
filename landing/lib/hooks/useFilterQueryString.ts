import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function buildQueryString(queryObject: QueryObject, existingQuery?: string): string {
  const params = existingQuery ? new URLSearchParams(existingQuery) : new URLSearchParams()

  Object.entries(queryObject).forEach(([key, value]) => {
    if (value === undefined) params.delete(key)
    else params.set(key, value)
  })

  const result = params.toString()
  return result ? `?${result}` : ''
}

export type QueryObject = Record<string, string | undefined>
type QueryOptions = {
  type: 'push' | 'replace'
  scroll?: boolean
}

export default function useFilterQueryString() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (queryObject: QueryObject) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(queryObject).forEach(([key, value]) => {
        if (value === undefined) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      return params.toString()
    },
    [searchParams]
  )

  const filterQueryString = useCallback(
    (
      queryObject: QueryObject,
      queryOptions: QueryOptions = {
        type: 'push',
        scroll: false,
      }
    ) => {
      const { type, scroll } = queryOptions
      const url = `${pathname}${buildQueryString(queryObject, searchParams.toString())}`

      router[type](url, { scroll })
    },
    [pathname, router, searchParams]
  )

  return {
    pathname,
    searchParams,
    filterQueryString,
    createQueryString,
  }
}
