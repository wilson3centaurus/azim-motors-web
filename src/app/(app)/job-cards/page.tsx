import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default async function JobCardsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('job_cards')
    .select(`
      id, job_number, status, complaint, date_received, estimated_return, labour_cost, total_parts_cost,
      customers(full_name, phone),
      vehicles(registration, make, model),
      mechanic:assigned_mechanic(full_name)
    `)
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.q) {
    query = query.or(`job_number.ilike.%${params.q}%,complaint.ilike.%${params.q}%`)
  }

  const { data: jobs } = await query

  const statuses = ['all', 'Pending', 'In Progress', 'Completed', 'Cancelled']

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Job Cards</h1>
          <p className="text-sm text-slate-500 mt-0.5">{jobs?.length ?? 0} total jobs</p>
        </div>
        <Link
          href="/job-cards/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> New Job Card
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {statuses.map(s => (
          <Link
            key={s}
            href={`/job-cards${s === 'all' ? '' : `?status=${encodeURIComponent(s)}`}`}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              (params.status === s || (!params.status && s === 'all'))
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            )}
          >
            {s === 'all' ? 'All' : s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Job #</th>
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Customer</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Vehicle</th>
                <th className="hidden md:table-cell px-5 py-3 font-medium text-slate-600">Complaint</th>
                <th className="hidden lg:table-cell px-5 py-3 font-medium text-slate-600">Mechanic</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Est. Return</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">No job cards found.</td>
                </tr>
              )}
              {jobs?.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/job-cards/${job.id}`} className="text-blue-600 hover:underline font-medium">
                      {job.job_number}
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <p className="font-medium text-slate-900">{job.customers?.full_name}</p>
                    <p className="text-xs text-slate-400 sm:hidden">{job.vehicles?.registration}</p>
                    <p className="hidden sm:block text-xs text-slate-400">{job.customers?.phone}</p>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3">
                    <p className="font-medium text-slate-900">{job.vehicles?.registration}</p>
                    <p className="text-xs text-slate-400">{job.vehicles?.make} {job.vehicles?.model}</p>
                  </td>
                  <td className="hidden md:table-cell px-5 py-3 text-slate-600 max-w-xs truncate">{job.complaint}</td>
                  <td className="hidden lg:table-cell px-5 py-3 text-slate-600">{job.mechanic?.full_name ?? '—'}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-600">{formatDate(job.estimated_return)}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap', JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS])}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
