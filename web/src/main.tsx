import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { ApiError, setUnauthorizedHandler } from './lib/api'
import { qk } from './lib/queries'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
})

// Any 401 means the session is gone: drop cached data and go to login, remembering where we were.
setUnauthorizedHandler(() => {
  const here = window.location.pathname + window.location.search
  if (window.location.pathname.startsWith('/login')) return
  queryClient.clear()
  queryClient.setQueryData(qk.me, undefined)
  void router.navigate(`/login?next=${encodeURIComponent(here)}`, { replace: true })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
