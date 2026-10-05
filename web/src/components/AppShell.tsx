import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { BottomNavigation } from './layout/BottomNavigation'
import { ContextMapPanel } from './layout/ContextMapPanel'
import { PageContainer } from './layout/PageContainer'

const fullBleedRoutes = ['/app/navigation', '/app/active-trip']

export function AppShell() {
  const { pathname } = useLocation()
  const fullBleed = fullBleedRoutes.some((r) => pathname.startsWith(r))

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:flex-row">
        <main
          className={`min-w-0 flex-1 ${
            fullBleed ? 'fixed inset-0 z-20 lg:relative lg:inset-auto' : 'px-4 pb-28 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8'
          }`}
        >
          {fullBleed ? (
            <Outlet />
          ) : (
            <PageContainer key={pathname}>
              <Outlet />
            </PageContainer>
          )}
        </main>
        {!fullBleed && <ContextMapPanel />}
      </div>
      {!fullBleed && <BottomNavigation />}
    </div>
  )
}
