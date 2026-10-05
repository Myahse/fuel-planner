import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listFuelTransactions } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { SpecList } from '../components/ui'

export function FuelTransactionPage() {
  const { id } = useParams()
  const { vehicle } = useActiveVehicle()
  const txQuery = useQuery({
    queryKey: ['fuel-transactions', vehicle?.id],
    queryFn: () => listFuelTransactions(vehicle?.id),
    enabled: Boolean(vehicle?.id),
  })

  const tx = txQuery.data?.find((t) => t.id === id) ?? txQuery.data?.[0]

  return (
    <div className="space-y-6">
      <PageHeader title="Fill-up saved" backTo="/app" />
      {!tx && <p className="text-fg-2">We couldn&apos;t find that fill-up.</p>}
      {tx && (
        <>
          <p className="readout text-6xl text-fg">
            {Math.round(tx.total_amount).toLocaleString('en-US')}
            <span className="unit ml-1.5 text-sm">FCFA</span>
          </p>
          <div className="border-y border-line">
            <SpecList
              rows={[
                ['Date', new Date(tx.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })],
                ['Litres', `${tx.liters.toFixed(1)} L`],
                ['Price', `${Math.round(tx.price_per_liter).toLocaleString('en-US')} FCFA/L`],
                ['Vehicle', vehicle ? `${vehicle.make} ${vehicle.model}` : '—'],
                ...(tx.notes ? ([['Notes', tx.notes]] as [string, string][]) : []),
              ]}
            />
          </div>
          <Link to="/app" className="btn btn-ghost w-full">
            Back to home
          </Link>
        </>
      )}
    </div>
  )
}
