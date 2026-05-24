import { requireAnyRole } from '@/lib/auth'
import { getSalesDashboardData } from '@/lib/data'

import { SalesPos } from './sales-pos'

export default async function SalesPage() {
  const user = await requireAnyRole(['admin', 'salesperson'])
  const salesData = await getSalesDashboardData(user.role === 'salesperson' ? user.id : undefined)

  return <SalesPos currentUser={user} {...salesData} />
}