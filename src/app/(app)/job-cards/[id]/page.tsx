import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import { JobCardActions } from './job-card-actions'
import { PartsSection } from './parts-section'
import { getJobCardDetail } from '@/lib/data'

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { job, mechanics } = await getJobCardDetail(id)

  if (!job) notFound()

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/job-cards" className="text-sm text-blue-600 hover:underline">← Job Cards</Link>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{job.job_number}</h1>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border mt-1 inline-block', JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS])}>
            {job.status}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/job-cards/${id}/print`}
            target="_blank"
            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            Print
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</h2>
          <p className="font-semibold text-slate-900">{job.customers?.full_name}</p>
          <p className="text-sm text-slate-600 mt-1">{job.customers?.phone}</p>
          {job.customers?.email && <p className="text-sm text-slate-500">{job.customers.email}</p>}
          <Link href={`/customers/${job.customer_id}`} className="text-xs text-blue-600 hover:underline mt-2 block">View customer →</Link>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Vehicle</h2>
          <p className="font-semibold text-slate-900">{job.vehicles?.registration}</p>
          <p className="text-sm text-slate-600 mt-1">{job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year}</p>
          {job.vehicles?.color && <p className="text-sm text-slate-500">{job.vehicles.color}</p>}
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dates</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Received</span>
              <span className="font-medium text-slate-900">{formatDate(job.date_received)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Est. Return</span>
              <span className="font-medium text-slate-900">{formatDate(job.estimated_return)}</span>
            </div>
            {job.actual_return && (
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Return</span>
                <span className="font-medium text-green-700">{formatDate(job.actual_return)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint & Diagnosis */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Complaint</h2>
          <p className="text-sm text-slate-800">{job.complaint}</p>
        </div>
        {job.diagnosis && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnosis</h2>
            <p className="text-sm text-slate-800">{job.diagnosis}</p>
          </div>
        )}
        {job.work_done && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Work Done</h2>
            <p className="text-sm text-slate-800">{job.work_done}</p>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-slate-100">
          <span className="text-sm text-slate-500">Assigned Mechanic</span>
          <span className="text-sm font-medium text-slate-900">{job.mechanic?.full_name ?? 'Unassigned'}</span>
        </div>
      </div>

      {/* Parts Used */}
      <PartsSection jobId={id} jobCardParts={job.job_card_parts ?? []} />

      {/* Cost Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cost Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Labour</span>
            <span className="font-medium">{formatCurrency(job.labour_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Parts</span>
            <span className="font-medium">{formatCurrency(job.total_parts_cost)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-slate-900">{formatCurrency((job.labour_cost ?? 0) + (job.total_parts_cost ?? 0))}</span>
          </div>
        </div>
      </div>

      {/* Actions (client component for status changes) */}
      <JobCardActions job={job} mechanics={mechanics ?? []} />
    </div>
  )
}
