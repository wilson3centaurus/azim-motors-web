import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { listCustomersForSelection, listMechanics, listParts, listSuppliers, listVehiclesForCustomer } from '@/lib/data'

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resource = request.nextUrl.searchParams.get('resource')

  if (resource === 'suppliers') {
    return NextResponse.json({ suppliers: await listSuppliers() })
  }

  if (resource === 'job-form') {
    const [customers, mechanics] = await Promise.all([
      listCustomersForSelection(),
      listMechanics(),
    ])
    return NextResponse.json({ customers, mechanics })
  }

  if (resource === 'vehicles') {
    const customerId = request.nextUrl.searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json({ vehicles: [] })
    }
    return NextResponse.json({ vehicles: await listVehiclesForCustomer(customerId) })
  }

  if (resource === 'available-parts') {
    const parts = await listParts()
    return NextResponse.json({ parts: parts.filter(part => part.quantity > 0) })
  }

  return NextResponse.json({ error: 'Unknown lookup resource.' }, { status: 400 })
}