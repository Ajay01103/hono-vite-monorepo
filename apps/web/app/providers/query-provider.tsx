// React Router v7 SSR Setup for TanStack Query
// This follows the Remix pattern since React Router v7 is built on Remix

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request
  // This ensures data is not shared between different users and requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
