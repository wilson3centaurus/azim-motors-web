'use client'

import { useState, useTransition } from 'react'
import type { Part, Supplier } from '@/lib/supabase/types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { updatePartAction, adjustPartStockAction } from '@/lib/actions'

export function PartEditForm({ part, suppliers }: { part: Part; suppliers: Supplier[] }) {
  const [saving, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
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
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await updatePartAction({
        id: part.id,
        name: form.name,
        part_number: form.part_number,
        description: form.description,
        reorder_level: Number(form.reorder_level),
        unit_cost: Number(form.unit_cost),
        selling_price: form.selling_price !== '' ? parseFloat(String(form.selling_price)) : null,
        supplier_id: form.supplier_id || null,
        location: form.location,
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      setMessage(result.message)
    })
  }

  async function handleAdjust() {
    if (adjustQty === 0) return
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await adjustPartStockAction({ id: part.id, quantity: adjustQty, reason: adjustReason })
      if (!result.ok) {
        setError(result.message)
        return
      }

      setAdjustQty(0)
      setAdjustReason('')
      setMessage(result.message)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Edit Part</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input id="edit-part-name" label="Part Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <Input id="edit-part-number" label="Part Number" value={form.part_number} onChange={e => setForm(p => ({ ...p, part_number: e.target.value }))} />
        <Input id="edit-part-location" label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        <Input id="edit-part-reorder" label="Reorder Level" type="number" value={String(form.reorder_level)} onChange={e => setForm(p => ({ ...p, reorder_level: parseInt(e.target.value || '0', 10) }))} />
        <Input id="edit-part-cost" label="Unit Cost (USD)" type="number" step="0.01" value={String(form.unit_cost)} onChange={e => setForm(p => ({ ...p, unit_cost: parseFloat(e.target.value || '0') }))} prefix="$" />
        <Input id="edit-part-sell" label="Selling Price (USD)" type="number" step="0.01" value={String(form.selling_price)} onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))} prefix="$" />
        <div>
          <Select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))} label="Supplier">
            <option value="">— None —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      </div>

      <Button type="button" onClick={handleSave} loading={saving}>Save Changes</Button>

      {/* Stock Adjustment */}
      <div className="border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Adjust Stock</h3>
        <div className="flex gap-3 flex-wrap">
          <Input type="number" placeholder="±Qty (e.g. +10 or -3)" value={adjustQty || ''} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)} containerClassName="w-40" />
          <Input placeholder="Reason (optional)" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} containerClassName="flex-1 min-w-40" />
          <Button type="button" variant="secondary" onClick={handleAdjust} disabled={saving || adjustQty === 0}>Apply Adjustment</Button>
        </div>
      </div>
    </div>
  )
}
