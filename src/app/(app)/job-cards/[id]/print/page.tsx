import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getJobCardPrintData } from '@/lib/data'

export default async function PrintJobCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { job } = await getJobCardPrintData(id)

  if (!job) notFound()

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans print:p-0">
      <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-bold">AZIM MOTORS</h1>
        <p className="text-sm text-slate-600">Garage Management System</p>
        <p className="text-lg font-bold mt-2">{job.job_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-bold text-sm uppercase border-b mb-2">Customer</h2>
          <p className="font-medium">{job.customers?.full_name}</p>
          <p className="text-sm text-slate-600">{job.customers?.phone}</p>
          {job.customers?.email && <p className="text-sm text-slate-600">{job.customers.email}</p>}
        </div>
        <div>
          <h2 className="font-bold text-sm uppercase border-b mb-2">Vehicle</h2>
          <p className="font-medium">{job.vehicles?.registration}</p>
          <p className="text-sm text-slate-600">{job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year}</p>
          {job.vehicles?.color && <p className="text-sm text-slate-600">Color: {job.vehicles.color}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div><span className="font-medium">Received:</span> {formatDate(job.date_received)}</div>
        <div><span className="font-medium">Est. Return:</span> {formatDate(job.estimated_return)}</div>
        <div><span className="font-medium">Mechanic:</span> {job.mechanic?.full_name ?? '—'}</div>
        <div><span className="font-medium">Status:</span> {job.status}</div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold text-sm uppercase border-b mb-2">Complaint</h2>
        <p className="text-sm">{job.complaint}</p>
      </div>

      {job.diagnosis && (
        <div className="mb-6">
          <h2 className="font-bold text-sm uppercase border-b mb-2">Diagnosis</h2>
          <p className="text-sm">{job.diagnosis}</p>
        </div>
      )}

      {job.work_done && (
        <div className="mb-6">
          <h2 className="font-bold text-sm uppercase border-b mb-2">Work Done</h2>
          <p className="text-sm">{job.work_done}</p>
        </div>
      )}

      {job.job_card_parts?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-sm uppercase border-b mb-2">Parts Used</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Part</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Unit Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {job.job_card_parts.map(p => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-1">{p.parts?.name}</td>
                  <td className="text-right py-1">{p.quantity_used}</td>
                  <td className="text-right py-1">{formatCurrency(p.unit_cost)}</td>
                  <td className="text-right py-1">{formatCurrency(p.quantity_used * p.unit_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t-2 border-slate-900 pt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Labour</span><span>{formatCurrency(job.labour_cost)}</span></div>
        <div className="flex justify-between"><span>Parts</span><span>{formatCurrency(job.total_parts_cost)}</span></div>
        <div className="flex justify-between font-bold text-base border-t mt-1 pt-1">
          <span>TOTAL</span><span>{formatCurrency((job.labour_cost ?? 0) + (job.total_parts_cost ?? 0))}</span>
        </div>
      </div>

      <div className="mt-8 text-xs text-slate-400 text-center">
        Printed on {new Date().toLocaleDateString()} — Azim Motors Garage Management System
      </div>

      <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print()' }} />
    </div>
  )
}
