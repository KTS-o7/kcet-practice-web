import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export const qk = {
  me: ['me'] as const,
  meta: ['meta'] as const,
  stats: ['stats'] as const,
  attempts: ['attempts'] as const,
  attempt: (id: string) => ['attempt', id] as const,
  admin: ['admin'] as const,
}

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: api.me, staleTime: Infinity, retry: false })
export const useMeta = () => useQuery({ queryKey: qk.meta, queryFn: api.meta, staleTime: 10 * 60_000 })
export const useStats = () => useQuery({ queryKey: qk.stats, queryFn: api.stats })
export const useAttempts = () => useQuery({ queryKey: qk.attempts, queryFn: api.attempts })
export const useAdminOverview = () => useQuery({ queryKey: qk.admin, queryFn: api.adminOverview, staleTime: 60_000, retry: false })
