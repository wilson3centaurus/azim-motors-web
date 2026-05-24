'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer, Vehicle, UserProfile } from '@/lib/supabase/types'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createJobCardAction } from '@/lib/actions'
import { displayVehicleRegistration } from '@/lib/utils'

const SERVICE_TYPES = ['General Service', 'Engine Repair', 'Suspension', 'Brake Service', 'Electrical Diagnosis', 'Body Work', 'Tyres', 'Other']

export default function NewJobCardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Step 1: Customer
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', email: '' })
  const [createNewCustomer, setCreateNewCustomer] = useState(false)

  // Step 2: Vehicle
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [newVehicle, setNewVehicle] = useState({ registration: '', make: '', model: '', year: '', color: '' })
  const [createNewVehicle, setCreateNewVehicle] = useState(false)

  // Step 3: Job details
  const [mechanics, setMechanics] = useState<UserProfile[]>([])
  const [form, setForm] = useState({
    service_type: 'General Service',
    complaint: '',
    assigned_mechanic: '',
    estimated_return: '',
    quoted_amount: '0',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/lookups?resource=job-form')
      .then(response => response.json())
      .then(data => {
        setCustomers(data.customers ?? [])
        setMechanics(data.mechanics ?? [])
      })
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/lookups?resource=vehicles&customerId=${selectedCustomer.id}`)
        .then(response => response.json())
        .then(data => setVehicles(data.vehicles ?? []))
    }
  }, [selectedCustomer])

  const filteredCustomers = useMemo(() => customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  ), [customers, customerSearch])

  function firstFieldError(errors?: Record<string, string[]>) {
    if (!errors) return null
    for (const messages of Object.values(errors)) {
      if (messages && messages.length > 0) {
        return messages[0]
      }
    }
    return null
  }

  async function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = await createJobCardAction({
        selectedCustomerId: createNewCustomer ? null : selectedCustomer?.id,
        newCustomer: createNewCustomer ? newCustomer : undefined,
        selectedVehicleId: createNewVehicle ? null : selectedVehicle?.id,
        newVehicle: createNewVehicle ? {
          ...newVehicle,
          year: newVehicle.year ? parseInt(newVehicle.year, 10) : null,
        } : undefined,
        complaint: form.complaint,
        service_type: form.service_type,
        assigned_mechanic: form.assigned_mechanic || null,
        estimated_return: form.estimated_return || null,
        quoted_amount: Number(form.quoted_amount || 0),
        notes: form.notes,
      })

      if (!result.ok) {
        setError(firstFieldError(result.errors) ?? result.message)
        return
      }

      router.push(`/job-cards/${result.id}`)
    })
  }

  return (
    <div className="max-w-2xl p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-[#eef5f2] sm:text-xl">New Job Card</h1>
        <div className="flex items-center gap-2 mt-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-slate-500 dark:text-[#9eb5af]">{step === 1 ? 'Customer' : step === 2 ? 'Vehicle' : 'Job Details'}</span>
        </div>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <Card className="space-y-4 border-[#dfe9e4] bg-white/92 p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-6">
        {/* Step 1: Customer */}
        {step === 1 && (
          <>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCreateNewCustomer(false)} className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${!createNewCustomer ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                Existing Customer
              </button>
              <button onClick={() => setCreateNewCustomer(true)} className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${createNewCustomer ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                New Customer
              </button>
            </div>
            {!createNewCustomer ? (
              <>
                <Input
                  id="job-customer-search"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-[#27433e] dark:divide-[#1f3732]">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27] ${selectedCustomer?.id === c.id ? 'border-l-2 border-blue-600 bg-blue-50 dark:bg-[#17342f]' : ''}`}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-[#eef5f2]">{c.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-[#8ea59f]">{c.phone}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Input id="new-customer-name" label="Full name *" value={newCustomer.full_name} onChange={e => setNewCustomer(p => ({ ...p, full_name: e.target.value }))} />
                <Input id="new-customer-phone" label="Phone *" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
                <Input id="new-customer-email" type="email" label="Email (optional)" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
              </>
            )}
          </>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCreateNewVehicle(false)} className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${!createNewVehicle ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                Existing Vehicle
              </button>
              <button onClick={() => setCreateNewVehicle(true)} className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${createNewVehicle ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                New Vehicle
              </button>
            </div>
            {!createNewVehicle ? (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-[#27433e] dark:divide-[#1f3732]">
                {vehicles.length === 0 && <p className="px-4 py-3 text-sm text-slate-400 dark:text-[#8ea59f]">No vehicles for this customer. Add a new one.</p>}
                {vehicles.map(v => (
                  <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27] ${selectedVehicle?.id === v.id ? 'border-l-2 border-blue-600 bg-blue-50 dark:bg-[#17342f]' : ''}`}>
                    <p className="text-sm font-medium text-slate-900 dark:text-[#eef5f2]">{displayVehicleRegistration(v.registration)}</p>
                    <p className="text-xs text-slate-500 dark:text-[#8ea59f]">{v.make} {v.model} {v.year}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input id="new-vehicle-registration" label="Licence Plate" hint="Leave blank if the vehicle has no plate yet." value={newVehicle.registration} onChange={e => setNewVehicle(p => ({ ...p, registration: e.target.value }))} containerClassName="sm:col-span-2" />
                <Input id="new-vehicle-make" label="Make *" value={newVehicle.make} onChange={e => setNewVehicle(p => ({ ...p, make: e.target.value }))} />
                <Input id="new-vehicle-model" label="Model *" value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} />
                <Input id="new-vehicle-year" label="Year" value={newVehicle.year} onChange={e => setNewVehicle(p => ({ ...p, year: e.target.value }))} />
                <Input id="new-vehicle-color" label="Color" value={newVehicle.color} onChange={e => setNewVehicle(p => ({ ...p, color: e.target.value }))} />
              </div>
            )}
          </>
        )}

        {/* Step 3: Job Details */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Service Type" value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))}>
                {SERVICE_TYPES.map(service => <option key={service} value={service}>{service}</option>)}
              </Select>
              <Input id="job-quoted-amount" label="Quoted Amount (USD)" type="number" min="0" step="0.01" value={form.quoted_amount} onChange={e => setForm(p => ({ ...p, quoted_amount: e.target.value }))} prefix="$" />
            </div>
            <div>
              <Textarea id="job-complaint" label="Problem / Complaint *" rows={4} value={form.complaint} onChange={e => setForm(p => ({ ...p, complaint: e.target.value }))} placeholder="Describe the issue..." />
            </div>
            <div>
              <Select label="Assigned Mechanic" value={form.assigned_mechanic} onChange={e => setForm(p => ({ ...p, assigned_mechanic: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}{m.phone ? ` — ${m.phone}` : ''}</option>
                ))}
              </Select>
              {form.assigned_mechanic && (() => {
                const m = mechanics.find(x => x.id === form.assigned_mechanic)
                return m ? (
                  <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.full_name}</p>
                      {m.phone && <p className="text-xs text-slate-500">{m.phone}</p>}
                    </div>
                  </div>
                ) : null
              })()}
              {mechanics.length === 0 && (
                <p className="text-xs text-slate-400 mt-1.5">
                  No mechanics yet. <a href="/settings/users" className="text-blue-600 hover:underline">Add mechanics in Settings → Users</a>
                </p>
              )}
            </div>
            <div>
              <Input id="job-estimated-return" label="Estimated Return Date" type="date" value={form.estimated_return} onChange={e => setForm(p => ({ ...p, estimated_return: e.target.value }))} />
            </div>
            <div>
              <Textarea id="job-notes" label="Notes" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </>
        )}
      </Card>

      <div className="flex justify-between mt-4">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !createNewCustomer && !selectedCustomer}
            type="button"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.complaint || !form.service_type}
            type="button"
            loading={loading}
          >
            Create Job Card
          </Button>
        )}
      </div>
    </div>
  )
}
