import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listFuelTransactions } from '../api/endpoints'
import { useActiveVehicle } from '../hooks/useActiveVehicle'
import { PageHeader } from '../components/layout/PageHeader'
import { formatFcfa, formatLiters } from '../lib/format'

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
    <div className="space-y-4">
      <PageHeader title="Fuel Transaction" backTo="/app/fuel/add" />
      {!tx && <p className="text-muted">Transaction not found.</p>}
      {tx && (
        <div className="rounded-3xl bg-white p-5 shadow-card space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Date</span><span>{new Date(tx.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted">Liters</span><span className="font-bold">{formatLiters(tx.liters)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Price/L</span><span>{tx.price_per_liter} FCFA/L</span></div>
          <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-bold text-brand-800">{formatFcfa(tx.total_amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Vehicle</span><span>{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</span></div>
          {tx.notes && <div><span className="text-muted">Notes</span><p className="mt-1">{tx.notes}</p></div>}
        </div>
      )}
    </div>
  )
}
