import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './layout/Sidebar'
import { BottomNavigation } from './layout/BottomNavigation'
import { ContextMapPanel } from './layout/ContextMapPanel'
import { MobileAppBar } from './layout/MobileAppBar'
import { PageContainer } from './layout/PageContainer'

const fullBleedRoutes = ['/app/navigation', '/app/active-trip', '/app/trip-confirm']

export function AppShell() {
  const { pathname } = useLocation()
  const fullBleed = fullBleedRoutes.some((r) => pathname.startsWith(r))

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0 lg:flex-row">
        <div className="flex min-h-screen flex-1 flex-col">
          {!fullBleed && <MobileAppBar />}
          <main
            className={`flex-1 ${
              fullBleed
                ? 'fixed inset-0 z-20 lg:relative lg:inset-auto'
                : 'px-4 py-4 pb-24 pt-2 sm:px-5 lg:max-w-none lg:flex-1 lg:px-8 lg:py-8 lg:pb-8'
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
          {!fullBleed && <BottomNavigation />}
        </div>
        {!fullBleed && <ContextMapPanel />}
      </div>
    </div>
  )
}
