import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import { ReturnCalendar } from './return-calendar'

export default async function ReturnDatesPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: jobs } = await supabase
    .from('job_cards')
    .select(`id, job_number, status, estimated_return, customers(full_name), vehicles(registration, make, model)`)
    .not('status', 'in', '("Completed","Cancelled")')
    .not('estimated_return', 'is', null)
    .order('estimated_return', { ascending: true })

  const overdue = jobs?.filter(j => j.estimated_return! < today) ?? []
  const todayJobs = jobs?.filter(j => j.estimated_return === today) ?? []
  const upcoming = jobs?.filter(j => j.estimated_return! > today) ?? []

  const calendarEvents = jobs?.map(j => ({
    id: j.id,
    title: `${(j as any).vehicles?.registration} — ${(j as any).customers?.full_name}`,
    date: j.estimated_return!,
    status: j.status,
    jobNumber: j.job_number,
  })) ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <h1 className="text-lg sm:text-xl font-bold text-slate-900">Return Dates</h1>

      {/* Alert strip */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">⚠ {overdue.length} Overdue {overdue.length === 1 ? 'Job' : 'Jobs'}</p>
          <div className="space-y-1">
            {overdue.map((j: any) => (
              <Link key={j.id} href={`/job-cards/${j.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 text-sm text-red-700 hover:underline">
                <span className="truncate">{j.job_number} · {j.vehicles?.registration} · {j.customers?.full_name}</span>
                <span className="font-medium shrink-0">Due {formatDate(j.estimated_return)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <ReturnCalendar events={calendarEvents} />

      {/* Today */}
      {todayJobs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-orange-50">
            <h2 className="font-semibold text-orange-800">Due Today ({todayJobs.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {todayJobs.map((j: any) => (
              <Link key={j.id} href={`/job-cards/${j.id}`} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{j.job_number} · {j.vehicles?.registration}</p>
                  <p className="text-xs text-slate-500">{j.customers?.full_name} · {j.vehicles?.make} {j.vehicles?.model}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full border shrink-0', JOB_STATUS_COLORS[j.status as keyof typeof JOB_STATUS_COLORS])}>
                  {j.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Upcoming Returns ({upcoming.length})</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {upcoming.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No upcoming returns.</p>}
          {upcoming.map((j: any) => (
            <Link key={j.id} href={`/job-cards/${j.id}`} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{j.job_number} · {j.vehicles?.registration}</p>
                <p className="text-xs text-slate-500">{j.customers?.full_name}</p>
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full shrink-0">
                {formatDate(j.estimated_return)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
