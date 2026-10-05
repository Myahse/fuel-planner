import { Link } from 'react-router-dom'
import { CarViewer } from '../components/car3d/CarViewer'
import { BrandMark } from '../components/layout/BrandMark'
import { FlipDigits } from '../components/retro/FlipDigits'

export function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-6">
        <BrandMark />
        <Link to="/auth?mode=login" className="text-sm font-medium text-fg-2 hover:text-fg">
          Sign in
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-6 pb-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="order-2 lg:order-1">
          <p className="unit">fuel planning · côte d&apos;ivoire</p>
          <h1 className="title mt-4 text-[2.6rem] leading-[0.95] text-fg sm:text-[3.6rem]">
            Know how far
            <br />
            your fuel
            <br />
            <span className="text-signal">takes you.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-fg-2">
            Tell FUELGO how many bars your gauge shows. Before you leave, it tells you whether you&apos;ll make it, what it costs, and where to stop.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth?mode=register" className="btn btn-primary px-8">
              Get started
            </Link>
            <Link to="/auth?mode=login" className="btn btn-ghost px-6">
              I have an account
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <CarViewer
            vehicle={{ make: 'Toyota', model: 'RAV4', paint_color: '#f2b33d', body_style: 'suv' }}
            variant="hero"
            autoRotate
            className="rounded-[26px] border-[2.5px] border-espresso bg-panel"
          />
          <div className="pump -mt-6 relative mx-4 flex items-center justify-between gap-3 p-4">
            <span>
              <span className="unit block !text-mustard">range · km</span>
              <span className="mt-1 block text-xs text-digit/70">6 of 8 bars · 38.2 L</span>
            </span>
            <FlipDigits value="412" size="lg" label="412 kilometres of range" />
          </div>
        </div>
      </main>
    </div>
  )
}
