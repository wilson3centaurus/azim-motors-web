import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, AlertTriangle } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: parts } = await supabase
    .from('parts')
    .select('*, suppliers(name)')
    .eq('is_active', true)
    .order('name')

  const lowStock = parts?.filter(p => p.quantity <= p.reorder_level) ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{parts?.length ?? 0} parts · {lowStock.length} low on stock</p>
        </div>
        <Link href="/inventory/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Part
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {lowStock.map(p => p.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} running low.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="px-4 sm:px-5 py-3 font-medium text-slate-600">Part Name</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Part #</th>
                <th className="px-3 sm:px-5 py-3 font-medium text-slate-600">Qty</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Reorder</th>
                <th className="hidden sm:table-cell px-5 py-3 font-medium text-slate-600">Unit Cost</th>
                <th className="hidden lg:table-cell px-5 py-3 font-medium text-slate-600">Sell Price</th>
                <th className="hidden md:table-cell px-5 py-3 font-medium text-slate-600">Supplier</th>
                <th className="hidden lg:table-cell px-5 py-3 font-medium text-slate-600">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {parts?.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">No parts found. Add your first part.</td></tr>
              )}
              {parts?.map(part => {
                const isLow = part.quantity <= part.reorder_level
                return (
                  <tr key={part.id} className={cn('hover:bg-slate-50 transition-colors', isLow && 'bg-amber-50/50')}>
                    <td className="px-4 sm:px-5 py-3">
                      <Link href={`/inventory/${part.id}`} className="font-medium text-blue-600 hover:underline">
                        {part.name}
                      </Link>
                      {isLow && <span className="sm:hidden ml-1.5 text-xs text-red-500 font-semibold">LOW</span>}
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{part.part_number ?? '—'}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={cn('font-semibold', isLow ? 'text-red-600' : 'text-slate-900')}>
                        {part.quantity}
                      </span>
                      {isLow && <span className="hidden sm:inline ml-2 text-xs text-red-500 font-medium">LOW</span>}
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3 text-slate-500">{part.reorder_level}</td>
                    <td className="hidden sm:table-cell px-5 py-3 text-slate-700">{formatCurrency(part.unit_cost)}</td>
                    <td className="hidden lg:table-cell px-5 py-3 text-slate-700">{part.selling_price ? formatCurrency(part.selling_price) : '—'}</td>
                    <td className="hidden md:table-cell px-5 py-3 text-slate-500">{(part as any).suppliers?.name ?? '—'}</td>
                    <td className="hidden lg:table-cell px-5 py-3 text-slate-500">{part.location ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
