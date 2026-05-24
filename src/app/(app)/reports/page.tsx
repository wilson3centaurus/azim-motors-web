'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function download(type: 'jobs' | 'stock', format: 'excel' | 'pdf') {
    setLoading(`${type}-${format}`)
    const params = new URLSearchParams({ format, ...(dateFrom && { from: dateFrom }), ...(dateTo && { to: dateTo }) })
    const res = await fetch(`/api/export/${type}?${params}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hazim-motors-${type}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(null)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Reports & Export</h1>
        <p className="text-sm text-slate-500 mt-0.5">Download job history and stock reports</p>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Date Range (optional)</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label htmlFor="reports-date-from" className="block text-xs text-slate-600 mb-1">From</label>
            <input id="reports-date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="reports-date-to" className="block text-xs text-slate-600 mb-1">To</label>
            <input id="reports-date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Job History Report */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900">Job History Report</h2>
            <p className="text-sm text-slate-500 mt-0.5">All completed job cards with parts used, costs, and mechanic details</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => download('jobs', 'excel')}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {loading === 'jobs-excel' ? 'Generating...' : 'Download Excel'}
              </button>
              <button
                onClick={() => download('jobs', 'pdf')}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {loading === 'jobs-pdf' ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Report */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-xl flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900">Stock / Inventory Report</h2>
            <p className="text-sm text-slate-500 mt-0.5">Current inventory levels, values, low-stock alerts, and supplier info</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => download('stock', 'excel')}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {loading === 'stock-excel' ? 'Generating...' : 'Download Excel'}
              </button>
              <button
                onClick={() => download('stock', 'pdf')}
                disabled={loading !== null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {loading === 'stock-pdf' ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
