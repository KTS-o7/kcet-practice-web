import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { syncAnalyticsUser } from './lib/analytics'
import { ApiError, setUnauthorizedHandler } from './lib/api'
import { qk } from './lib/queries'
import { router } from './router'
import type { User } from './lib/types'

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

// Analytics follow who's logged in (see lib/analytics.ts). On the login page nobody is; elsewhere we
// wait for /api/me so a student who hasn't allowed analytics is never tracked, not even briefly.
if (window.location.pathname.startsWith('/login')) syncAnalyticsUser(null)
queryClient.getQueryCache().subscribe((e) => {
  // only real updates: a 'removed' event (sign-out clears the cache) still carries the old user
  if (e.type !== 'updated' || e.query.queryKey[0] !== qk.me[0] || e.query.queryKey.length !== 1) return
  const st = e.query.state
  if (st.status === 'success') syncAnalyticsUser(st.data as User | undefined)
  else if (st.status === 'error' && st.error instanceof ApiError && st.error.status === 401) syncAnalyticsUser(null)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
