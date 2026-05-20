import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const format = searchParams.get('format') ?? 'excel'

  const supabase = await createServiceClient()

  const { data: parts } = await supabase
    .from('parts')
    .select('*, suppliers(name)')
    .eq('is_active', true)
    .order('name')

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Azim Motors'

    const ws = wb.addWorksheet('Stock Report')
    ws.columns = [
      { header: 'Part Name', key: 'name', width: 30 },
      { header: 'Part Number', key: 'part_number', width: 16 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Reorder Level', key: 'reorder_level', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Unit Cost (USD)', key: 'unit_cost', width: 16 },
      { header: 'Selling Price (USD)', key: 'selling_price', width: 18 },
      { header: 'Stock Value (USD)', key: 'stock_value', width: 18 },
      { header: 'Supplier', key: 'supplier', width: 22 },
      { header: 'Location', key: 'location', width: 16 },
    ]

    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    parts?.forEach((p: any) => {
      const isLow = p.quantity <= p.reorder_level
      const row = ws.addRow({
        name: p.name,
        part_number: p.part_number ?? '',
        quantity: p.quantity,
        reorder_level: p.reorder_level,
        status: isLow ? 'LOW STOCK' : 'OK',
        unit_cost: p.unit_cost,
        selling_price: p.selling_price ?? '',
        stock_value: p.quantity * p.unit_cost,
        supplier: p.suppliers?.name ?? '',
        location: p.location ?? '',
      })
      if (isLow) {
        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }
        row.getCell('status').font = { color: { argb: 'FFDC2626' }, bold: true }
      }
    })

    const totalValue = parts?.reduce((s, p) => s + p.quantity * p.unit_cost, 0) ?? 0
    ws.addRow([])
    const totalRow = ws.addRow({ name: 'TOTAL STOCK VALUE', stock_value: totalValue })
    totalRow.font = { bold: true }

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="azim-motors-stock.xlsx"',
      },
    })
  }

  const rows = parts?.map((p: any) => {
    const isLow = p.quantity <= p.reorder_level
    return `<tr style="${isLow ? 'background:#fef2f2;' : ''}">
      <td>${p.name}</td><td>${p.part_number ?? ''}</td>
      <td style="font-weight:${isLow ? 'bold' : 'normal'};color:${isLow ? '#dc2626' : 'inherit'}">${p.quantity}</td>
      <td>${p.reorder_level}</td><td style="color:${isLow ? '#dc2626' : '#16a34a'}">${isLow ? 'LOW' : 'OK'}</td>
      <td>$${p.unit_cost.toLocaleString()}</td>
      <td>$${(p.quantity * p.unit_cost).toLocaleString()}</td>
      <td>${(p as any).suppliers?.name ?? ''}</td>
      <td>${p.location ?? ''}</td>
    </tr>`
  }).join('')

  const totalValue = parts?.reduce((s, p) => s + p.quantity * p.unit_cost, 0) ?? 0
  const html = `<!DOCTYPE html><html><head><title>Stock Report - Azim Motors</title>
    <style>body{font-family:sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#1e3a5f;color:#fff}</style></head>
    <body><h1>Azim Motors — Stock Report</h1>
    <p>Generated: ${new Date().toLocaleDateString('en-KE')} | Total parts: ${parts?.length} | Total value: $${totalValue.toLocaleString()}</p>
    <table><thead><tr><th>Part</th><th>Part #</th><th>Qty</th><th>Reorder</th><th>Status</th><th>Unit Cost</th><th>Stock Value</th><th>Supplier</th><th>Location</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="azim-motors-stock.html"',
    },
  })
}
