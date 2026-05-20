'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import type { Part } from '@/lib/supabase/types'

export function PartsSection({ jobId, jobCardParts }: { jobId: string; jobCardParts: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [parts, setParts] = useState<Part[]>([])
  const [search, setSearch] = useState('')
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.from('parts').select('*').eq('is_active', true).gt('quantity', 0).then(({ data }) => setParts(data ?? []))
  }, [])

  const filtered = parts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.part_number?.toLowerCase().includes(search.toLowerCase()))

  async function addPart() {
    if (!selectedPart) return
    setAdding(true)
    await supabase.from('job_card_parts').insert({
      job_card_id: jobId,
      part_id: selectedPart.id,
      quantity_used: qty,
      unit_cost: selectedPart.selling_price ?? selectedPart.unit_cost,
    })
    setSelectedPart(null)
    setSearch('')
    setQty(1)
    setShowForm(false)
    setAdding(false)
    router.refresh()
  }

  async function removePart(lineId: string) {
    await supabase.from('job_card_parts').delete().eq('id', lineId)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parts Used</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3 border border-slate-200">
          <input
            placeholder="Search part by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {filtered.map(p => (
                <button key={p.id} onClick={() => { setSelectedPart(p); setSearch(p.name) }} className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm ${selectedPart?.id === p.id ? 'bg-blue-50' : ''}`}>
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
            <input type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value))} className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addPart} disabled={!selectedPart || adding} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-0 divide-y divide-slate-50">
        {jobCardParts.length === 0 && <p className="text-sm text-slate-400 py-2">No parts added yet.</p>}
        {jobCardParts.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{item.parts?.name}</p>
              <p className="text-xs text-slate-400">{item.parts?.part_number} • {item.quantity_used} × {formatCurrency(item.unit_cost)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-900">{formatCurrency(item.quantity_used * item.unit_cost)}</span>
              <button onClick={() => removePart(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
