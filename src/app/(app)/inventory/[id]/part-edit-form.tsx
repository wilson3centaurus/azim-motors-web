'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function PartEditForm({ part, suppliers }: { part: any; suppliers: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: part.name,
    part_number: part.part_number ?? '',
    description: part.description ?? '',
    quantity: part.quantity,
    reorder_level: part.reorder_level,
    unit_cost: part.unit_cost,
    selling_price: part.selling_price ?? '',
    supplier_id: part.supplier_id ?? '',
    location: part.location ?? '',
  })
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')

  async function handleSave() {
    setSaving(true)
    await supabase.from('parts').update({
      ...form,
      selling_price: form.selling_price !== '' ? parseFloat(String(form.selling_price)) : null,
      supplier_id: form.supplier_id || null,
    }).eq('id', part.id)
    setSaving(false)
    router.refresh()
  }

  async function handleAdjust() {
    if (adjustQty === 0) return
    setSaving(true)
    const newQty = part.quantity + adjustQty
    await supabase.from('parts').update({ quantity: newQty }).eq('id', part.id)
    await supabase.from('stock_movements').insert({
      part_id: part.id,
      movement_type: 'ADJUSTMENT',
      quantity: adjustQty,
      quantity_before: part.quantity,
      quantity_after: newQty,
      reason: adjustReason || 'Manual adjustment',
    })
    setAdjustQty(0)
    setAdjustReason('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Edit Part</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Number</label>
          <input value={form.part_number} onChange={e => setForm(p => ({ ...p, part_number: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
          <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reorder Level</label>
          <input type="number" value={form.reorder_level} onChange={e => setForm(p => ({ ...p, reorder_level: parseInt(e.target.value) }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Cost (USD)</label>
          <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(p => ({ ...p, unit_cost: parseFloat(e.target.value) }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price (USD)</label>
          <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
          <select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— None —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Stock Adjustment */}
      <div className="border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Adjust Stock</h3>
        <div className="flex gap-3 flex-wrap">
          <input type="number" placeholder="±Qty (e.g. +10 or -3)" value={adjustQty || ''} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)} className="w-40 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Reason (optional)" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="flex-1 min-w-40 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleAdjust} disabled={saving || adjustQty === 0} className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
            Apply Adjustment
          </button>
        </div>
      </div>
    </div>
  )
}
