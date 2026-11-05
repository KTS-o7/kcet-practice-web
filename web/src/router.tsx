import { lazy } from 'react'
import { createBrowserRouter, Link, useRouteError } from 'react-router'
import { AppShell, RequireAuth } from './components/Shell'
import Home from './routes/Home'
import Login from './routes/Login'

const Setup = lazy(() => import('./routes/Setup'))
const Test = lazy(() => import('./routes/Test'))
const Results = lazy(() => import('./routes/Results'))
const Progress = lazy(() => import('./routes/Progress'))
const History = lazy(() => import('./routes/History'))
const Admin = lazy(() => import('./routes/Admin'))
const AdminStudent = lazy(() => import('./routes/AdminStudent'))

function RouteError() {
  const err = useRouteError()
  const msg = err instanceof Error ? err.message : 'Something went wrong.'
  const chunk = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg)
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="font-display text-h2">{chunk ? 'Kaagada was updated.' : 'This page hit a problem.'}</p>
      <p className="mt-2 text-muted">{chunk ? 'Reload to get the new version.' : msg}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
        <Link to="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-display text-h1">Nothing on this page.</p>
      <p className="mt-2 text-muted">The link may be old.</p>
      <Link to="/" className="btn btn-secondary mt-6">
        Go home
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { path: '/test/:id', element: <Test /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Home /> },
          { path: '/practice/:subject', element: <Setup /> },
          { path: '/results/:id', element: <Results /> },
          { path: '/progress', element: <Progress /> },
          { path: '/history', element: <History /> },
          { path: '/admin', element: <Admin /> },
          { path: '/admin/students/:id', element: <AdminStudent /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
