import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/layout/BrandMark'
import { LiquidTank } from '../components/liquid/LiquidTank'
import { AnimatedNumber } from '../components/liquid/AnimatedNumber'

/** Splash: the tank fills up as the page opens, then states what the app does. */
export function OnboardingPage() {
  const [level, setLevel] = useState(0.05)
  useEffect(() => {
    const id = setTimeout(() => setLevel(0.72), 250)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <LiquidTank level={level} reserve={0.1} bars={8} className="absolute inset-0 bg-bg" />

      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <BrandMark />
          <Link to="/auth?mode=login" className="chip">
            Sign in
          </Link>
        </header>

        <div className="mt-14">
          <p className="unit">fuel planning · côte d&apos;ivoire</p>
          <h1 className="title mt-4 text-[2.6rem] text-fg sm:text-[3.4rem]">Know how far your fuel takes you.</h1>
        </div>

        <div className="mt-auto">
          <p className="readout text-[5rem] text-fg drop-shadow-[0_2px_18px_rgb(16_12_8/0.45)]">
            <AnimatedNumber value={level > 0.5 ? 412 : 0} duration={1400} />
            <span className="ml-2 font-[family-name:var(--font-sans)] text-2xl font-bold tracking-normal">km</span>
          </p>
          <p className="mt-3 max-w-[34ch] text-base font-semibold leading-relaxed text-fg">
            Tell FUELGO how many bars your gauge shows. Before you leave, it tells you whether you&apos;ll make it, what it costs, and where to refuel.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth?mode=register" className="btn btn-ghost !bg-fg !text-bg sm:flex-1">
              Get started
            </Link>
            <Link to="/auth?mode=login" className="btn btn-ghost sm:flex-1">
              I have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
