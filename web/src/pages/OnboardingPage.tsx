import { Link } from 'react-router-dom'
import { PrimaryButton } from '../components/buttons/PrimaryButton'
import { PRODUCT } from '../config/product'

const HERO =
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80'

export function OnboardingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col px-6 pb-10 pt-8">
        <p className="text-sm font-bold tracking-[0.2em] text-white/80">{PRODUCT.name}</p>
        <div className="flex-1" />
        <div className="flex justify-center gap-2 pb-6">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span className="h-2 w-2 rounded-full bg-white/40" />
        </div>
        <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          {PRODUCT.tagline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/85">
          Plan your trips, estimate fuel costs, find fuel stations and never run out of fuel
          unexpectedly.
        </p>
        <div className="mt-10 space-y-3">
          <Link to="/auth?mode=register">
            <PrimaryButton fullWidth className="bg-brand-600 hover:bg-brand-500">
              Get Started →
            </PrimaryButton>
          </Link>
          <Link
            to="/auth?mode=login"
            className="block w-full rounded-2xl py-3 text-center text-base font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
