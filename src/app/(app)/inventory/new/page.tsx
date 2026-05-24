'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Supplier } from '@/lib/supabase/types'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createPartAction } from '@/lib/actions'
import { GARAGE_PART_CATALOG } from '@/lib/part-catalog'

export default function NewPartPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [customCatalogNames, setCustomCatalogNames] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', part_number: '', description: '', quantity: 0,
    reorder_level: 0, unit_cost: 0, selling_price: '', supplier_id: '', location: ''
  })
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact_name: '', phone: '', email: '', address: ''
  })

  useEffect(() => {
    fetch('/api/lookups?resource=suppliers')
      .then(response => response.json())
      .then(data => setSuppliers(data.suppliers ?? []))
  }, [])

  const catalogOptions = useMemo(() => {
    const unique = new Set([...GARAGE_PART_CATALOG, ...customCatalogNames.map(name => name.trim())].filter(Boolean))
    return Array.from(unique)
  }, [customCatalogNames])

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    const source = query
      ? catalogOptions.filter(name => name.toLowerCase().includes(query))
      : catalogOptions

    return source.slice(0, 24)
  }, [catalogOptions, catalogSearch])

  const hasExactCatalogMatch = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    return query.length > 0 && catalogOptions.some(name => name.toLowerCase() === query)
  }, [catalogOptions, catalogSearch])

  function firstFieldError(errors?: Record<string, string[]>) {
    if (!errors) return null
    for (const messages of Object.values(errors)) {
      if (messages && messages.length > 0) {
        return messages[0]
      }
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await createPartAction({
        ...form,
        quantity: Number(form.quantity),
        reorder_level: Number(form.reorder_level || 0),
        unit_cost: Number(form.unit_cost),
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
        supplier_id: form.supplier_id || undefined,
        newSupplier: addingSupplier ? supplierForm : null,
      })

      if (!result.ok) {
        setError(firstFieldError(result.errors) ?? result.message)
        return
      }

      router.push(result.redirectTo)
    })
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const sf = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSupplierForm(p => ({ ...p, [field]: e.target.value }))

  function applyCatalogName(name: string) {
    setForm(p => ({ ...p, name }))
    setCatalogSearch(name)
  }

  function addCustomCatalogName() {
    const value = catalogSearch.trim()
    if (!value) return
    if (!catalogOptions.some(name => name.toLowerCase() === value.toLowerCase())) {
      setCustomCatalogNames(current => [...current, value])
    }
    applyCatalogName(value)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/inventory" className="text-sm text-blue-600 hover:underline">← Inventory</Link>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Add New Part</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Quick add works with just name, quantity, unit cost, and selling price. Everything else is optional.</p>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit}>
      <Card className="space-y-5 p-4 sm:p-6">
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-strong)]">Garage part finder</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Search common filters, oils, electrical, brake, suspension, tyre, and workshop items.</p>
            </div>
            <div className="w-full sm:max-w-sm">
              <Input id="catalog-search" label="Search common part names" value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Try oil filter, brake pads, 10W40, bulb..." />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filteredCatalog.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => applyCatalogName(name)}
                className="rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-base)] transition hover:border-[#1f5f59] hover:text-[#1f5f59]"
              >
                {name}
              </button>
            ))}
            {filteredCatalog.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)]">No preset matches yet.</div>
            ) : null}
          </div>

          {catalogSearch.trim() && !hasExactCatalogMatch ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Not seeing it?</span>
              <button
                type="button"
                onClick={addCustomCatalogName}
                className="rounded-full border border-dashed border-[#1f5f59] px-3 py-1.5 text-xs font-semibold text-[#1f5f59] transition hover:bg-[#1f5f59] hover:text-white"
              >
                Use custom name: {catalogSearch.trim()}
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input id="part-name" label="Part Name *" hint="Pick from the part finder above or type your own." required value={form.name} onChange={f('name')} />
          </div>
          <Input id="part-number" label="Part Number / SKU" value={form.part_number} onChange={f('part_number')} />
          <Input id="part-location" label="Location / Shelf" value={form.location} onChange={f('location')} />
          <Input id="part-qty" label="Quantity *" type="number" min={0} required value={String(form.quantity)} onChange={f('quantity')} />
          <Input id="part-reorder" label="Reorder Level" type="number" min={0} value={String(form.reorder_level)} onChange={f('reorder_level')} hint="Optional. Leave as 0 if you do not want alerts yet." />
          <Input id="part-unit-cost" label="Unit Cost (USD) *" type="number" min={0} step="0.01" required value={String(form.unit_cost)} onChange={f('unit_cost')} prefix="$" />
          <Input id="part-selling-price" label="Selling Price (USD)" type="number" min={0} step="0.01" value={form.selling_price} onChange={f('selling_price')} prefix="$" />

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
              <Select
                id="part-supplier"
                value={form.supplier_id} onChange={f('supplier_id')}
              >
                <option value="">— None —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            ) : (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Supplier Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      id="supplier-name"
                      label="Company / Supplier Name *"
                      required={addingSupplier} value={supplierForm.name} onChange={sf('name')}
                      placeholder="e.g. AutoParts Ltd"
                    />
                  </div>
                  <Input id="supplier-contact" label="Contact Person" value={supplierForm.contact_name} onChange={sf('contact_name')} placeholder="e.g. John Doe" />
                  <Input id="supplier-phone" label="Phone" type="tel" value={supplierForm.phone} onChange={sf('phone')} placeholder="+1 555 000 0000" />
                  <Input id="supplier-email" label="Email" type="email" value={supplierForm.email} onChange={sf('email')} placeholder="supplier@example.com" />
                  <Input id="supplier-address" label="Address" value={supplierForm.address} onChange={sf('address')} placeholder="Street, City" />
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <Textarea id="part-description" label="Description" rows={3} value={form.description} onChange={f('description')} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" loading={loading}>Add Part</Button>
          <Link href="/inventory" className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </Card>
      </form>
    </div>
  )
}
