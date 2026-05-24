import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { getVehicleHistory } from '@/lib/data'

export default async function VehicleHistoryPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params
  const { vehicle, records } = await getVehicleHistory(vehicleId)

  if (!vehicle) notFound()

  const totalSpend = records?.reduce((s, r) => s + (r.total_cost ?? 0), 0) ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-5">
      <div>
        <Link href="/repair-records" className="text-sm text-blue-600 hover:underline">← Repair Records</Link>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{vehicle.registration}</h1>
        <p className="text-sm text-slate-500">{vehicle.make} {vehicle.model} {vehicle.year} · Owner: {vehicle.customers?.full_name}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Visits', value: records?.length ?? 0 },
          { label: 'Total Spend', value: formatCurrency(totalSpend) },
          { label: 'Last Service', value: records?.[0] ? formatDate(records[0].completed_at) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
        <div className="space-y-4">
          {records?.length === 0 && <p className="text-slate-400 text-sm pl-12">No repair history yet.</p>}
          {records?.map(r => {
            const partsUsed = r.job_cards?.job_card_parts ?? []

            return (
              <div key={r.id} className="relative pl-12">
                <div className="absolute left-3 top-4 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Link href={`/job-cards/${r.job_card_id}`} className="font-semibold text-blue-600 hover:underline">
                        {r.job_cards?.job_number}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(r.completed_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(r.total_cost)}</span>
                  </div>
                  {r.job_cards?.complaint && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-slate-500">Complaint: </span>
                      <span className="text-sm text-slate-700">{r.job_cards.complaint}</span>
                    </div>
                  )}
                  {r.work_done && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-slate-500">Work Done: </span>
                      <span className="text-sm text-slate-700">{r.work_done}</span>
                    </div>
                  )}
                  {r.technician_name && (
                    <p className="text-xs text-slate-400">Mechanic: {r.technician_name}</p>
                  )}
                  {partsUsed.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Parts Used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {partsUsed.map((p, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {p.parts?.name} ×{p.quantity_used}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
