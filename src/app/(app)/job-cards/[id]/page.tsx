import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatCurrency, JOB_STATUS_COLORS, cn, displayVehicleRegistration } from '@/lib/utils'
import { JobCardActions } from './job-card-actions'
import { PartsSection } from './parts-section'
import { getJobCardDetail } from '@/lib/data'
import { requireUser } from '@/lib/auth'

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const { job, mechanics } = await getJobCardDetail(id)

  if (!job) notFound()

  const currentTotal = (job.quoted_amount ?? 0) + (job.labour_cost ?? 0) + (job.total_parts_cost ?? 0)

  return (
    <div className="max-w-4xl space-y-4 p-4 sm:space-y-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/job-cards" className="text-sm text-blue-600 hover:underline">← Job Cards</Link>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900 dark:text-[#eef5f2] sm:text-xl">{job.job_number}</h1>
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
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Customer</h2>
          <p className="font-semibold text-slate-900 dark:text-[#eef5f2]">{job.customers?.full_name}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#b8cac4]">{job.customers?.phone}</p>
          {job.customers?.email && <p className="text-sm text-slate-500 dark:text-[#8ea59f]">{job.customers.email}</p>}
          <Link href={`/customers/${job.customer_id}`} className="text-xs text-blue-600 hover:underline mt-2 block">View customer →</Link>
        </div>

        {/* Vehicle */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Vehicle</h2>
          <p className="font-semibold text-slate-900 dark:text-[#eef5f2]">{displayVehicleRegistration(job.vehicles?.registration)}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#b8cac4]">{job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year}</p>
          {job.vehicles?.color && <p className="text-sm text-slate-500 dark:text-[#8ea59f]">{job.vehicles.color}</p>}
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Dates</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#8ea59f]">Received</span>
              <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{formatDate(job.date_received)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#8ea59f]">Est. Return</span>
              <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{formatDate(job.estimated_return)}</span>
            </div>
            {job.actual_return && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#8ea59f]">Actual Return</span>
                <span className="font-medium text-green-700">{formatDate(job.actual_return)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#8ea59f]">Notification</span>
              <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{job.customer_notification_sent ? 'Emailed' : 'Pending / not sent'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint & Diagnosis */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#122c27]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#9eb5af]">Service Type</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{job.service_type ?? 'General Repair'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#122c27]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#9eb5af]">Quoted Amount</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(job.quoted_amount)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-[#122c27]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[#9eb5af]">Payment Status</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{job.payment_status}</p>
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Customer Complaint</h2>
          <p className="text-sm text-slate-800 dark:text-[#d7e5df]">{job.complaint}</p>
        </div>
        {job.diagnosis && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Diagnosis</h2>
            <p className="text-sm text-slate-800 dark:text-[#d7e5df]">{job.diagnosis}</p>
          </div>
        )}
        {job.work_done && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Work Done</h2>
            <p className="text-sm text-slate-800 dark:text-[#d7e5df]">{job.work_done}</p>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-[#1f3732]">
          <span className="text-sm text-slate-500 dark:text-[#8ea59f]">Assigned Mechanic</span>
          <span className="text-sm font-medium text-slate-900 dark:text-[#eef5f2]">{job.mechanic?.full_name ?? 'Unassigned'}</span>
        </div>
      </div>

      {/* Parts Used */}
      <PartsSection jobId={id} jobCardParts={job.job_card_parts ?? []} />

      {/* Actions (client component for status changes) */}
      <JobCardActions job={job} mechanics={mechanics ?? []} canDelete={user.role === 'admin' || user.role === 'mechanic'} />

      {/* Cost Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9eb5af]">Cost Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-[#b8cac4]">Quoted Total</span>
            <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{formatCurrency(job.quoted_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-[#b8cac4]">Labour</span>
            <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{formatCurrency(job.labour_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-[#b8cac4]">Parts</span>
            <span className="font-medium text-slate-900 dark:text-[#eef5f2]">{formatCurrency(job.total_parts_cost)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 dark:border-[#1f3732]">
            <span className="font-semibold text-slate-900 dark:text-[#eef5f2]">Current Total</span>
            <span className="font-bold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(currentTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
