'use client'

import { useEffect, useState, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import type { JobCardPart, Part } from '@/lib/supabase/types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addJobPartAction, removeJobPartAction } from '@/lib/actions'

export function PartsSection({ jobId, jobCardParts }: { jobId: string; jobCardParts: JobCardPart[] }) {
  const [pending, startTransition] = useTransition()
  const [parts, setParts] = useState<Part[]>([])
  const [search, setSearch] = useState('')
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [qty, setQty] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/lookups?resource=available-parts')
      .then(response => response.json())
      .then(data => setParts(data.parts ?? []))
  }, [])

  const filtered = parts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.part_number?.toLowerCase().includes(search.toLowerCase()))

  async function addPart() {
    if (!selectedPart) return
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await addJobPartAction({
        job_card_id: jobId,
        part_id: selectedPart.id,
        quantity: qty,
        available: selectedPart.quantity,
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      setSelectedPart(null)
      setSearch('')
      setQty(1)
      setShowForm(false)
      setMessage(result.message)
    })
  }

  async function removePart(lineId: string) {
    setError('')
    setMessage('')
    startTransition(async () => {
      const result = await removeJobPartAction({ lineId, job_card_id: jobId })
      if (!result.ok) {
        setError(result.message)
        return
      }

      setMessage(result.message)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parts Used</h2>
        <button type="button" onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>
      </div>
      {message && <Alert variant="success" className="mb-4">{message}</Alert>}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {showForm && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3 border border-slate-200">
          <Input
            id="job-part-search"
            placeholder="Search part by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {filtered.map(p => (
                <button type="button" key={p.id} onClick={() => { setSelectedPart(p); setSearch(p.name) }} className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm ${selectedPart?.id === p.id ? 'bg-blue-50' : ''}`}>
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className="text-slate-400 ml-2">{p.part_number}</span>
                  <span className="text-slate-500 ml-2">• Qty: {p.quantity}</span>
                  <span className="text-blue-600 ml-2">{formatCurrency(p.selling_price ?? p.unit_cost)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <label className="text-sm text-slate-600">Quantity:</label>
            <Input id="job-part-qty" type="number" min={1} value={String(qty)} onChange={e => setQty(parseInt(e.target.value || '1', 10))} containerClassName="w-20" />
            <Button type="button" onClick={addPart} loading={pending} disabled={!selectedPart}>Add</Button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-0 divide-y divide-slate-50">
        {jobCardParts.length === 0 && <p className="text-sm text-slate-400 py-2">No parts added yet.</p>}
        {jobCardParts.map(item => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{item.parts?.name}</p>
              <p className="text-xs text-slate-400">{item.parts?.part_number} • {item.quantity_used} × {formatCurrency(item.unit_cost)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-900">{formatCurrency(item.quantity_used * item.unit_cost)}</span>
              <button type="button" aria-label={`Remove ${item.parts?.name ?? 'part'}`} title={`Remove ${item.parts?.name ?? 'part'}`} onClick={() => removePart(item.id)} disabled={pending} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
