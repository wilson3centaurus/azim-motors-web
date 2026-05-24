import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { listCustomers } from '@/lib/data'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const customers = await listCustomers(params.q)

  return (
    <div className="space-y-4 p-2.5 sm:space-y-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers?.length ?? 0} registered customers</p>
        </div>
        <Link href="/customers/new" className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto sm:shrink-0 sm:justify-start sm:py-2">
          <Plus className="w-4 h-4" /> New Customer
        </Link>
      </div>

      <form method="GET">
        <input name="q" defaultValue={params.q} placeholder="Search by name, phone, or email..." className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-md sm:py-2.5 sm:text-sm" />
      </form>

      <div className="space-y-3 md:hidden">
        {customers?.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-400">No customers found.</div>}
        {customers?.map(c => (
          <Link key={c.id} href={`/customers/${c.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-600">{c.full_name}</p>
                <p className="mt-1 text-sm text-slate-700">{c.phone}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{c.email ?? 'No email'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {c.vehicles?.length ?? 0} vehicles
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Customer since {formatDate(c.created_at)}</p>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Name</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Phone</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Email</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600 text-right sm:text-left">Vehicles</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers?.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No customers found.</td></tr>
              )}
              {customers?.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.full_name}</Link>
                    <p className="sm:hidden text-xs text-slate-400 mt-0.5">{c.phone}</p>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-700">{c.phone}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{c.email ?? '—'}</td>
                  <td className="px-3 sm:px-5 py-3 text-slate-700 text-right sm:text-left">{c.vehicles?.length ?? 0}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
