import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { PartEditForm } from './part-edit-form'
import { getPartDetail } from '@/lib/data'

export default async function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { part, movements, suppliers } = await getPartDetail(id)

  if (!part) notFound()

  const isLow = part.quantity <= part.reorder_level

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4 sm:space-y-5">
      <div>
        <Link href="/inventory" className="text-sm text-blue-600 hover:underline">← Inventory</Link>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{part.name}</h1>
          {isLow && (
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">LOW STOCK</span>
          )}
        </div>
        {part.part_number && <p className="text-sm text-slate-500 mt-0.5">Part #: {part.part_number}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'In Stock', value: part.quantity.toString(), highlight: isLow },
          { label: 'Reorder Level', value: part.reorder_level.toString() },
          { label: 'Unit Cost', value: formatCurrency(part.unit_cost) },
          { label: 'Selling Price', value: formatCurrency(part.selling_price ?? part.unit_cost) },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={cn('text-xl sm:text-2xl font-bold', highlight ? 'text-red-600' : 'text-slate-900')}>{value}</p>
          </div>
        ))}
      </div>

      <PartEditForm part={part} suppliers={suppliers ?? []} />

      {/* Stock Movement History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Stock Movement History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Type</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600">Qty</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Date</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Before</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600">After</th>
                <th className="hidden md:table-cell px-5 py-3 font-medium text-slate-600">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements?.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No movements recorded.</td></tr>
              )}
              {movements?.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 sm:px-5 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', m.movement_type === 'IN' ? 'bg-green-100 text-green-700' : m.movement_type === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                      {m.movement_type}
                    </span>
                    <p className="sm:hidden text-xs text-slate-400 mt-0.5">{formatDateTime(m.created_at)}</p>
                  </td>
                  <td className="px-3 sm:px-5 py-3 font-medium">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{formatDateTime(m.created_at)}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{m.quantity_before}</td>
                  <td className="px-3 sm:px-5 py-3 text-slate-500">{m.quantity_after}</td>
                  <td className="hidden md:table-cell px-5 py-3 text-slate-500">{m.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
