'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Supplier } from '@/lib/supabase/types'
import Link from 'next/link'

export default function NewPartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', part_number: '', description: '', quantity: 0,
    reorder_level: 5, unit_cost: 0, selling_price: '', supplier_id: '', location: ''
  })
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact_name: '', phone: '', email: '', address: ''
  })

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data }) => setSuppliers(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let supplierId: string | null = form.supplier_id || null

    if (addingSupplier && supplierForm.name.trim()) {
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          name: supplierForm.name.trim(),
          contact_name: supplierForm.contact_name || null,
          phone: supplierForm.phone || null,
          email: supplierForm.email || null,
          address: supplierForm.address || null,
        })
        .select()
        .single()

      if (supplierError) {
        setError(supplierError.message)
        setLoading(false)
        return
      }
      supplierId = newSupplier.id
    }

    const { error } = await supabase.from('parts').insert({
      name: form.name,
      part_number: form.part_number || null,
      description: form.description || null,
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
      unit_cost: Number(form.unit_cost),
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      supplier_id: supplierId,
      location: form.location || null,
    })

    if (error) { setError(error.message); setLoading(false) }
    else router.push('/inventory')
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const sf = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSupplierForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/inventory" className="text-sm text-blue-600 hover:underline">← Inventory</Link>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Add New Part</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Name *</label>
            <input
              required value={form.name} onChange={f('name')}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Part Number / SKU</label>
            <input value={form.part_number} onChange={f('part_number')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location / Shelf</label>
            <input value={form.location} onChange={f('location')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity *</label>
            <input required type="number" min={0} value={form.quantity} onChange={f('quantity')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reorder Level</label>
            <input required type="number" min={0} value={form.reorder_level} onChange={f('reorder_level')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Cost (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input required type="number" min={0} step="0.01" value={form.unit_cost} onChange={f('unit_cost')} className="w-full pl-7 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min={0} step="0.01" value={form.selling_price} onChange={f('selling_price')} className="w-full pl-7 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Supplier */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Supplier</label>
              <button
                type="button"
                onClick={() => setAddingSupplier(v => !v)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                {addingSupplier ? '← Choose existing supplier' : '+ Add new supplier'}
              </button>
            </div>

            {!addingSupplier ? (
              <select
                value={form.supplier_id} onChange={f('supplier_id')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— None —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Supplier Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Company / Supplier Name *</label>
                    <input
                      required={addingSupplier} value={supplierForm.name} onChange={sf('name')}
                      placeholder="e.g. AutoParts Ltd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label>
                    <input value={supplierForm.contact_name} onChange={sf('contact_name')} placeholder="e.g. John Doe" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                    <input type="tel" value={supplierForm.phone} onChange={sf('phone')} placeholder="+1 555 000 0000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" value={supplierForm.email} onChange={sf('email')} placeholder="supplier@example.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                    <input value={supplierForm.address} onChange={sf('address')} placeholder="Street, City" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2} value={form.description} onChange={f('description')}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Add Part'}
          </button>
          <Link href="/inventory" className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
