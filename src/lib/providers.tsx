'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetches on layout switching
            gcTime: 10 * 60 * 1000, // 10 minutes - keeps data in cache longer
            retry: 1,
            refetchOnMount: false, // Don't refetch on mount if data is fresh
            refetchOnWindowFocus: false, // Don't refetch on window focus
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
