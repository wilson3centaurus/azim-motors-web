import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function RepairRecordsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('repair_records')
    .select(`
      *,
      vehicles(registration, make, model),
      customers(full_name, phone),
      job_cards(job_number)
    `)
    .order('completed_at', { ascending: false })

  const { data: records } = await query

  const filtered = records?.filter(r => {
    if (!params.q) return true
    const q = params.q.toLowerCase()
    return (
      (r as any).vehicles?.registration?.toLowerCase().includes(q) ||
      (r as any).customers?.full_name?.toLowerCase().includes(q) ||
      (r as any).job_cards?.job_number?.toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Repair Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} completed repairs</p>
        </div>
      </div>

      <form method="GET">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by plate, customer, or job number..."
          className="w-full sm:max-w-md px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Job #</th>
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Vehicle</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Customer</th>
                <th className="hidden md:table-cell px-5 py-3 font-medium text-slate-600">Work Done</th>
                <th className="hidden lg:table-cell px-5 py-3 font-medium text-slate-600">Mechanic</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Completed</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600 text-right sm:text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No repair records found.</td></tr>
              )}
              {filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/job-cards/${r.job_card_id}`} className="text-blue-600 hover:underline font-medium">
                      {r.job_cards?.job_number}
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/repair-records/${r.vehicle_id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {r.vehicles?.registration}
                    </Link>
                    <p className="text-xs text-slate-400">{r.vehicles?.make} {r.vehicles?.model}</p>
                    <p className="sm:hidden text-xs text-slate-400 mt-0.5">{r.customers?.full_name}</p>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-700">{r.customers?.full_name}</td>
                  <td className="hidden md:table-cell px-5 py-3 text-slate-500 max-w-xs truncate">{r.work_done ?? r.diagnosis ?? '—'}</td>
                  <td className="hidden lg:table-cell px-5 py-3 text-slate-600">{r.technician_name ?? '—'}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-600">{formatDate(r.completed_at)}</td>
                  <td className="px-3 sm:px-5 py-3 font-medium text-slate-900 text-right sm:text-left">{formatCurrency(r.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
