import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-enter mx-auto w-full max-w-xl xl:max-w-2xl">{children}</div>
}
