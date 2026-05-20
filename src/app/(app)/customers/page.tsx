import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*, vehicles(id)')
    .order('full_name')

  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`)
  }

  const { data: customers } = await query

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers?.length ?? 0} registered customers</p>
        </div>
        <Link href="/customers/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
          <Plus className="w-4 h-4" /> New Customer
        </Link>
      </div>

      <form method="GET">
        <input name="q" defaultValue={params.q} placeholder="Search by name, phone, or email..." className="w-full sm:max-w-md px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
              {customers?.map((c: any) => (
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
