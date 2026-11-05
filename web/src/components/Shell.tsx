import { CaretDownIcon, ChartBarIcon, DesktopIcon, KeyIcon, MoonIcon, SignOutIcon, SunIcon } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { api, ApiError } from '../lib/api'
import { useMe } from '../lib/queries'
import { useTheme } from '../lib/theme'
import { Skeleton } from './ui'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.015em] ${className}`}>
      Kaagada<span className="text-accent">.</span>
    </span>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-icon btn-sm text-muted hover:text-ink"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  )
}

function UserMenu({ name, admin = false }: { name: string; admin?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { pref, followSystem } = useTheme()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      qc.clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-2 px-1.5 sm:pr-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full bg-accent-tint font-display text-[13px] font-semibold text-accent"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-[12ch] truncate sm:inline">{name}</span>
        <CaretDownIcon size={12} className="hidden text-muted sm:block" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="fade-in absolute top-[calc(100%+6px)] right-0 z-30 w-56 rounded-[10px] border border-line bg-raised p-1.5 shadow-[0_12px_32px_-16px_rgb(31_27_22/0.35)]"
        >
          <p className="px-2.5 pt-1.5 pb-2 text-caption text-muted">
            Signed in as <span className="font-semibold text-ink">{name}</span>
          </p>
          <button
            role="menuitem"
            type="button"
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left hover:bg-paper"
            onClick={() => {
              setOpen(false)
              navigate('/account')
            }}
          >
            <KeyIcon size={16} aria-hidden /> Account and password
          </button>
          {admin && (
            <button
              role="menuitem"
              type="button"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left hover:bg-paper sm:hidden"
              onClick={() => {
                setOpen(false)
                navigate('/admin')
              }}
            >
              <ChartBarIcon size={16} aria-hidden /> Admin
            </button>
          )}
          {pref !== 'system' && (
            <button
              role="menuitem"
              type="button"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left hover:bg-paper"
              onClick={() => {
                followSystem()
                setOpen(false)
              }}
            >
              <DesktopIcon size={16} aria-hidden /> Follow system theme
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left hover:bg-paper"
            onClick={logout}
          >
            <SignOutIcon size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex h-12 items-center px-1 text-label transition-colors duration-150 ${
    isActive
      ? 'text-ink after:absolute after:inset-x-1 after:bottom-0 after:h-[2px] after:rounded-full after:bg-accent'
      : 'text-muted hover:text-ink'
  }`

export function TopBar({ name, admin = false }: { name: string; admin?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/92 backdrop-blur-[6px]">
      <div className="mx-auto flex h-12 max-w-[1120px] items-center gap-3 px-3 sm:gap-6 sm:px-6">
        <NavLink to="/" className="text-[19px] leading-none" aria-label="Kaagada home">
          <Wordmark />
        </NavLink>
        <nav aria-label="Main" className="flex items-center gap-3 sm:gap-5">
          <NavLink to="/" end className={navCls}>
            Home
          </NavLink>
          <NavLink to="/progress" className={navCls}>
            Progress
          </NavLink>
          <NavLink to="/history" className={navCls}>
            History
          </NavLink>
          {admin && (
            <NavLink to="/admin" className={(a) => `${navCls(a)} max-sm:hidden`}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ThemeToggle />
          <UserMenu name={name} admin={admin} />
        </div>
      </div>
    </header>
  )
}

function FullSkeleton() {
  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-[14px]" />
        ))}
      </div>
    </div>
  )
}

/** Gate: everything inside needs a session. */
export function RequireAuth() {
  const me = useMe()
  const loc = useLocation()
  if (me.isPending) return <BootSkeleton />
  if (me.error) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      const next = loc.pathname + loc.search
      return <Navigate to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} replace />
    }
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-display text-h2">Can’t reach Kaagada right now.</p>
        <p className="mt-2 text-muted">{me.error.message}</p>
        <button type="button" className="btn btn-secondary mt-6" onClick={() => me.refetch()}>
          Try again
        </button>
      </div>
    )
  }
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Outlet />
    </Suspense>
  )
}

function BootSkeleton() {
  return (
    <div>
      <div className="h-12 border-b border-line" />
      <FullSkeleton />
    </div>
  )
}

export function AppShell() {
  const me = useMe()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-raised focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <TopBar name={me.data?.name ?? ''} admin={me.data?.admin} />
      <main id="main" className="mx-auto max-w-[1120px] px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
        <Suspense fallback={<FullSkeletonInner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

function FullSkeletonInner() {
  return (
    <div className="mx-auto max-w-[1040px]">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-40" />
      <Skeleton className="mt-8 h-64 rounded-[14px]" />
    </div>
  )
}

