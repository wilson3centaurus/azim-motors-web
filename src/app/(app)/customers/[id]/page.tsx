import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import { getCustomerDetail } from '@/lib/data'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { customer, vehicles, jobs } = await getCustomerDetail(id)

  if (!customer) notFound()

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-4 sm:space-y-5">
      <div>
        <Link href="/customers" className="text-sm text-blue-600 hover:underline">← Customers</Link>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{customer.full_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Phone</span><span className="font-medium text-right">{customer.phone}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Email</span><span className="text-right break-all">{customer.email ?? '—'}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Address</span><span className="text-right">{customer.address ?? '—'}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">ID Number</span><span className="text-right">{customer.id_number ?? '—'}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Customer Since</span><span className="text-right">{formatDate(customer.created_at)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Stats</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Vehicles</span><span className="font-medium">{vehicles?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Jobs</span><span className="font-medium">{jobs?.length ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Open Jobs</span><span className="font-medium">{jobs?.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length ?? 0}</span></div>
          </div>
          {customer.notes && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Vehicles</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {vehicles?.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No vehicles registered.</p>}
          {vehicles?.map(v => (
            <div key={v.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{v.registration}</p>
                <p className="text-xs text-slate-500 truncate">{v.make} {v.model} {v.year} · {v.color}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href={`/repair-records/${v.id}`} className="text-xs text-blue-600 hover:underline">History</Link>
                <Link href={`/job-cards/new`} className="text-xs text-green-600 hover:underline">New Job</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Job History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Job #</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Vehicle</th>
                <th className="hidden md:table-cell px-5 py-3 font-medium text-slate-600">Complaint</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Received</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs?.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">No jobs yet.</td></tr>}
              {jobs?.map(j => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/job-cards/${j.id}`} className="text-blue-600 hover:underline font-medium">{j.job_number}</Link>
                    <p className="sm:hidden text-xs text-slate-400 mt-0.5">{j.vehicles?.registration}</p>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-700">{j.vehicles?.registration}</td>
                  <td className="hidden md:table-cell px-5 py-3 text-slate-500 max-w-xs truncate">{j.complaint}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{formatDate(j.date_received)}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap', JOB_STATUS_COLORS[j.status as keyof typeof JOB_STATUS_COLORS])}>
                      {j.status}
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
