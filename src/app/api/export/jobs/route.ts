import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getSessionUser } from '@/lib/auth'
import { getJobExportData } from '@/lib/data'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const format = searchParams.get('format') ?? 'excel'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const records = await getJobExportData({ from, to })

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Azim Motors'
    wb.created = new Date()

    const ws = wb.addWorksheet('Job History')
    ws.columns = [
      { header: 'Job #', key: 'job_number', width: 16 },
      { header: 'Completed Date', key: 'completed_at', width: 18 },
      { header: 'Customer', key: 'customer', width: 22 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Vehicle', key: 'vehicle', width: 18 },
      { header: 'Make/Model', key: 'make_model', width: 20 },
      { header: 'Complaint', key: 'complaint', width: 35 },
      { header: 'Work Done', key: 'work_done', width: 35 },
      { header: 'Mechanic', key: 'mechanic', width: 20 },
      { header: 'Labour (USD)', key: 'labour', width: 14 },
      { header: 'Parts (USD)', key: 'parts', width: 14 },
      { header: 'Total (USD)', key: 'total', width: 14 },
    ]

    ws.getRow(1).font = { bold: true }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    records.forEach(r => {
      ws.addRow({
        job_number: r.job_cards?.job_number,
        completed_at: new Date(r.completed_at).toLocaleDateString('en-KE'),
        customer: r.customers?.full_name,
        phone: r.customers?.phone,
        vehicle: r.vehicles?.registration,
        make_model: `${r.vehicles?.make} ${r.vehicles?.model}`,
        complaint: r.job_cards?.complaint,
        work_done: r.work_done,
        mechanic: r.technician_name,
        labour: r.labour_cost,
        parts: r.total_cost ? (r.total_cost - (r.labour_cost ?? 0)) : 0,
        total: r.total_cost,
      })
    })

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="azim-motors-jobs.xlsx"`,
      },
    })
  }

  // PDF: simple HTML → print approach (client handles print)
  const rows = records.map(r => `
    <tr>
      <td>${r.job_cards?.job_number ?? ''}</td>
      <td>${new Date(r.completed_at).toLocaleDateString('en-KE')}</td>
      <td>${r.customers?.full_name ?? ''}</td>
      <td>${r.vehicles?.registration ?? ''}</td>
      <td>${r.work_done ?? r.job_cards?.complaint ?? ''}</td>
      <td>${r.technician_name ?? ''}</td>
      <td>$${(r.total_cost ?? 0).toLocaleString()}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><title>Job History - Azim Motors</title>
    <style>body{font-family:sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#1e3a5f;color:#fff}
    tr:nth-child(even){background:#f8fafc}h1{font-size:16px}p{font-size:11px;color:#666}</style></head>
    <body><h1>Azim Motors — Job History Report</h1>
    <p>Generated: ${new Date().toLocaleDateString('en-KE')} | Total records: ${records.length}</p>
    <table><thead><tr><th>Job #</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Work Done</th><th>Mechanic</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="azim-motors-jobs.html"',
    },
  })
}
