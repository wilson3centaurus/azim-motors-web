import Link from 'next/link'
import { formatDate, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { listJobCards } from '@/lib/data'

export default async function JobCardsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams
  const jobs = await listJobCards({ status: params.status, q: params.q })

  const statuses = ['all', 'Pending', 'In Progress', 'Completed', 'Cancelled']

  return (
    <div className="space-y-4 p-2.5 sm:space-y-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Job Cards</h1>
          <p className="text-sm text-slate-500 mt-0.5">{jobs?.length ?? 0} total jobs</p>
        </div>
        <Link
          href="/job-cards/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto sm:shrink-0 sm:justify-start sm:py-2"
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

      <div className="space-y-3 md:hidden">
        {jobs?.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-400">No job cards found.</div>}
        {jobs?.map(job => (
          <Link key={job.id} href={`/job-cards/${job.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-600">{job.job_number}</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{job.customers?.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{job.vehicles?.registration} · {job.customers?.phone}</p>
              </div>
              <span className={cn('shrink-0 rounded-full border px-2 py-1 text-xs font-medium whitespace-nowrap', JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS])}>
                {job.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Vehicle</p>
                <p className="mt-1 text-slate-700">{job.vehicles?.make} {job.vehicles?.model}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Estimated Return</p>
                <p className="mt-1 text-slate-700">{formatDate(job.estimated_return)}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 text-sm text-slate-600">{job.complaint}</p>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
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
              {jobs?.map(job => (
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
