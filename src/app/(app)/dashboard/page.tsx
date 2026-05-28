import Link from 'next/link'
import {
  AlertTriangle,
  CalendarClock,
  Car,
  ClipboardList,
  Package,
  PlusCircle,
  ShoppingCart,
  UserPlus,
  Wrench,
} from 'lucide-react'

import { StatCard } from '@/components/dashboard/stat-card'
import { requireUser } from '@/lib/auth'
import { getDashboardData, getMechanicDashboardData, getSalesDashboardData } from '@/lib/data'
import type { JobCard, Part, Sale, UserRole } from '@/lib/supabase/types'
import {
  cn,
  displayVehicleRegistration,
  formatCurrency,
  formatDate,
  JOB_STATUS_COLORS,
  ROLE_LABELS,
  timeAgo,
} from '@/lib/utils'

type DashboardJobSummary = Pick<JobCard, 'id' | 'job_number' | 'status'> & {
  estimated_return?: string | null
  complaint?: string
  customers?: { full_name?: string }
  vehicles?: { registration?: string | null; make?: string; model?: string }
}

type QuickAction = {
  href: string
  label: string
  description: string
  icon: typeof ClipboardList
  gradient: string
  ring: string
}

const QUICK_ACTIONS_BY_ROLE: Record<UserRole, QuickAction[]> = {
  admin: [
    { href: '/job-cards/new', label: 'New Job Card', description: 'Open a repair intake', icon: ClipboardList, gradient: 'from-[#2e6f68] to-[#1f5f59]', ring: 'focus:ring-[#2e6f68]' },
    { href: '/customers/new', label: 'Add Customer', description: 'Register a vehicle owner', icon: UserPlus, gradient: 'from-[#53a27b] to-[#22714d]', ring: 'focus:ring-[#22714d]' },
    { href: '/inventory/new', label: 'Add Part', description: 'Stock a new item', icon: PlusCircle, gradient: 'from-[#d9af57] to-[#b98d2c]', ring: 'focus:ring-[#b98d2c]' },
    { href: '/sales', label: 'Open POS', description: 'Record a stock sale', icon: ShoppingCart, gradient: 'from-[#ef9259] to-[#d86f45]', ring: 'focus:ring-[#d86f45]' },
  ],
  mechanic: [
    { href: '/job-cards/new', label: 'New Job Card', description: 'Book in a vehicle', icon: ClipboardList, gradient: 'from-[#2e6f68] to-[#1f5f59]', ring: 'focus:ring-[#2e6f68]' },
    { href: '/job-cards', label: 'Active Repairs', description: 'Update assigned jobs', icon: Wrench, gradient: 'from-[#ef9259] to-[#d86f45]', ring: 'focus:ring-[#d86f45]' },
    { href: '/customers/new', label: 'Add Customer', description: 'Capture workshop intake', icon: UserPlus, gradient: 'from-[#53a27b] to-[#22714d]', ring: 'focus:ring-[#22714d]' },
    { href: '/return-dates', label: 'Return Calendar', description: 'Check promised dates', icon: CalendarClock, gradient: 'from-[#d9af57] to-[#b98d2c]', ring: 'focus:ring-[#b98d2c]' },
  ],
  salesperson: [
    { href: '/sales', label: 'New Sale', description: 'Serve a walk-in customer', icon: ShoppingCart, gradient: 'from-[#ef9259] to-[#d86f45]', ring: 'focus:ring-[#d86f45]' },
    { href: '/inventory', label: 'Check Stock', description: 'Search available parts', icon: Package, gradient: 'from-[#d9af57] to-[#b98d2c]', ring: 'focus:ring-[#b98d2c]' },
    { href: '/inventory/new', label: 'Receive Stock', description: 'Add a new stocked item', icon: PlusCircle, gradient: 'from-[#53a27b] to-[#22714d]', ring: 'focus:ring-[#22714d]' },
    { href: '/customers/new', label: 'New Customer', description: 'Capture buyer details', icon: UserPlus, gradient: 'from-[#2e6f68] to-[#1f5f59]', ring: 'focus:ring-[#2e6f68]' },
  ],
  receptionist: [
    { href: '/job-cards/new', label: 'New Job Card', description: 'Open a repair intake', icon: ClipboardList, gradient: 'from-[#2e6f68] to-[#1f5f59]', ring: 'focus:ring-[#2e6f68]' },
    { href: '/customers/new', label: 'Add Customer', description: 'Register a vehicle owner', icon: UserPlus, gradient: 'from-[#53a27b] to-[#22714d]', ring: 'focus:ring-[#22714d]' },
    { href: '/return-dates', label: 'Return Calendar', description: 'View scheduled returns', icon: CalendarClock, gradient: 'from-[#d9af57] to-[#b98d2c]', ring: 'focus:ring-[#b98d2c]' },
    { href: '/job-cards', label: 'Job Cards', description: 'Track active repairs', icon: ClipboardList, gradient: 'from-[#ef9259] to-[#d86f45]', ring: 'focus:ring-[#d86f45]' },
  ],
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 p-2.5 sm:space-y-6 sm:p-6">{children}</div>
}

function DashboardHeader({ name, role }: { name: string; role: UserRole }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = name.split(' ')[0] ?? name
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#eef5f2] sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-[#9eb5af] sm:text-sm">{today}</p>
      </div>
      <div className="inline-flex w-fit max-w-full items-center rounded-full border border-[#d7e5df] bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-[#27433e] dark:bg-[#102623] dark:text-[#c7d8d2]">
        {ROLE_LABELS[role]} Workspace
      </div>
    </div>
  )
}

function QuickActions({ role }: { role: UserRole }) {
  const actions = QUICK_ACTIONS_BY_ROLE[role]

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2.5">
        <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-[#7f9791]">Quick actions</p>
        <div className="h-px flex-1 bg-slate-200 dark:bg-[#27433e]" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ href, label, description, icon: Icon, gradient, ring }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'group rounded-xl border border-white/70 bg-white/90 p-3 shadow-[0_4px_24px_-8px_rgba(19,40,37,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-10px_rgba(19,40,37,0.3)] dark:border-[#27433e] dark:bg-[#102623]/92',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#081512]',
              ring,
            )}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm', gradient)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{label}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#9eb5af]">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Panel({
  title,
  action,
  icon: Icon,
  children,
}: {
  title: string
  action?: { href: string; label: string }
  icon: typeof ClipboardList
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_4px_24px_-8px_rgba(19,40,37,0.18)] dark:border-[#27433e] dark:bg-[#102623]/92">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 dark:border-[#1f3732] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#edf8f1] dark:bg-[#17342f]">
            <Icon className="h-4 w-4 text-[#22714d] dark:text-[#8ec3b1]" />
          </div>
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{title}</h2>
        </div>
        {action ? (
          <Link href={action.href} className="text-xs font-semibold text-[#1f5f59] hover:underline dark:text-[#9ad0c1]">
            {action.label}
          </Link>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  )
}

function EmptyState({ title }: { title: string }) {
  return <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-[#8ea59f]">{title}</div>
}

function JobList({ jobs, dueLabel = 'Due' }: { jobs: DashboardJobSummary[]; dueLabel?: string }) {
  if (jobs.length === 0) {
    return <EmptyState title="Nothing to show yet." />
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-[#1f3732]">
      {jobs.map(job => (
        <Link
          key={job.id}
          href={`/job-cards/${job.id}`}
          className="flex flex-col items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27] sm:flex-row sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">
              {displayVehicleRegistration(job.vehicles?.registration)}
              <span className="mx-1 text-slate-300 dark:text-[#46615a]">·</span>
              {job.customers?.full_name ?? 'Walk-in customer'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{job.job_number}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#d5ebe4] bg-[#edf8f1] px-2.5 py-1 text-[11px] font-semibold text-[#22714d] dark:border-[#27433e] dark:bg-[#17342f] dark:text-[#9ad0c1]">
            {dueLabel} {formatDate(job.estimated_return ?? null)}
          </span>
        </Link>
      ))}
    </div>
  )
}

function RecentJobsTable({ jobs }: { jobs: DashboardJobSummary[] }) {
  return (
    <Panel title="Recent job cards" icon={ClipboardList} action={{ href: '/job-cards', label: 'View all' }}>
      <div className="divide-y divide-slate-100 md:hidden dark:divide-[#1f3732]">
        {jobs.length === 0 ? <EmptyState title="No job cards yet." /> : null}
        {jobs.map(job => (
          <Link key={job.id} href={`/job-cards/${job.id}`} className="block px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27]">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f5f59] dark:text-[#9ad0c1]">{job.job_number}</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-[#c7d8d2]">{job.customers?.full_name ?? 'Walk-in customer'}</p>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold', JOB_STATUS_COLORS[job.status])}>
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8ea59f]">{displayVehicleRegistration(job.vehicles?.registration)}</p>
              <p className="line-clamp-2 text-sm text-slate-500 dark:text-[#8ea59f]">{job.complaint}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#112822]">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-[#7f9791]">Job</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-[#7f9791]">Customer</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-[#7f9791] sm:table-cell">Vehicle</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-[#7f9791] md:table-cell">Complaint</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-[#7f9791]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f3732]">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-[#8ea59f]">
                  No job cards yet.
                </td>
              </tr>
            ) : null}
            {jobs.map(job => (
              <tr key={job.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27]">
                <td className="px-4 py-3">
                  <Link href={`/job-cards/${job.id}`} className="text-sm font-semibold text-[#1f5f59] hover:underline dark:text-[#9ad0c1]">
                    {job.job_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-[#c7d8d2]">{job.customers?.full_name ?? 'Walk-in customer'}</td>
                <td className="hidden px-4 py-3 text-sm text-slate-700 dark:text-[#c7d8d2] sm:table-cell">{displayVehicleRegistration(job.vehicles?.registration)}</td>
                <td className="hidden max-w-xs px-4 py-3 text-sm text-slate-500 dark:text-[#8ea59f] md:table-cell">{job.complaint}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', JOB_STATUS_COLORS[job.status])}>
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function SalesList({ sales }: { sales: Sale[] }) {
  if (sales.length === 0) {
    return <EmptyState title="No sales recorded yet." />
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-[#1f3732]">
      {sales.map(sale => (
        <div key={sale.id} className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{sale.sale_number}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">
              {sale.customer_name ?? 'Counter sale'}
              <span className="mx-1">·</span>
              {sale.seller?.full_name ?? 'Sales desk'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(sale.total_amount)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{timeAgo(sale.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PartsSnapshot({ parts }: { parts: Part[] }) {
  if (parts.length === 0) {
    return <EmptyState title="No stocked parts available for sale." />
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-[#1f3732]">
      {parts.slice(0, 6).map(part => (
        <div key={part.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{part.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{part.part_number ?? 'No part number'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(part.selling_price ?? part.unit_cost)}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{part.quantity} in stock</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminDashboard({
  name,
  stats,
  upcomingJobs,
  overdueJobs,
  recentJobs,
  salesToday,
  salesCount,
}: {
  name: string
  stats: { carsInService: number; pendingJobs: number; lowStockCount: number }
  upcomingJobs: DashboardJobSummary[]
  overdueJobs: DashboardJobSummary[]
  recentJobs: DashboardJobSummary[]
  salesToday: number
  salesCount: number
}) {
  return (
    <PageShell>
      <DashboardHeader name={name} role="admin" />

      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cars In Service" value={stats.carsInService} icon={Car} color="blue" subtitle="Currently in workshop" />
        <StatCard title="Pending Jobs" value={stats.pendingJobs} icon={Wrench} color="orange" subtitle="Waiting to start" />
        <StatCard title="Low Stock Parts" value={stats.lowStockCount} icon={Package} color="amber" subtitle="Need restocking" />
        <StatCard title="Sales Today" value={formatCurrency(salesToday)} icon={ShoppingCart} color="green" subtitle={`${salesCount} transactions`} />
      </div>

      <QuickActions role="admin" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Upcoming returns" icon={CalendarClock} action={{ href: '/return-dates', label: 'Calendar' }}>
          <JobList jobs={upcomingJobs} dueLabel="Due" />
        </Panel>
        <Panel title="Overdue jobs" icon={AlertTriangle} action={{ href: '/job-cards?filter=overdue', label: 'View all' }}>
          <JobList jobs={overdueJobs} dueLabel="Missed" />
        </Panel>
      </div>

      <RecentJobsTable jobs={recentJobs} />
    </PageShell>
  )
}

function MechanicDashboard({
  name,
  activeJobs,
  completedToday,
}: {
  name: string
  activeJobs: DashboardJobSummary[]
  completedToday: number
}) {
  const pendingCount = activeJobs.filter(job => job.status === 'Pending').length
  const inProgressCount = activeJobs.filter(job => job.status === 'In Progress').length

  return (
    <PageShell>
      <DashboardHeader name={name} role="mechanic" />

      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Assigned Jobs" value={activeJobs.length} icon={ClipboardList} color="blue" subtitle="Open repair cards" />
        <StatCard title="Pending Start" value={pendingCount} icon={CalendarClock} color="amber" subtitle="Ready for workshop" />
        <StatCard title="In Progress" value={inProgressCount} icon={Wrench} color="orange" subtitle="Actively being worked" />
        <StatCard title="Completed Today" value={completedToday} icon={Car} color="green" subtitle="Closed off successfully" />
      </div>

      <QuickActions role="mechanic" />

      <Panel title="My active job cards" icon={Wrench} action={{ href: '/job-cards', label: 'Open list' }}>
        {activeJobs.length === 0 ? (
          <EmptyState title="No active job cards assigned to you right now." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1f3732]">
            {activeJobs.map(job => (
              <Link
                key={job.id}
                href={`/job-cards/${job.id}`}
                className="block px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#122c27]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900 dark:text-[#eef5f2]">{job.job_number}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-[#b8cac4]">{displayVehicleRegistration(job.vehicles?.registration)} · {job.customers?.full_name}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-[#8ea59f]">{job.complaint}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', JOB_STATUS_COLORS[job.status])}>
                      {job.status}
                    </span>
                    <span className="rounded-full border border-[#d5ebe4] bg-[#edf8f1] px-2.5 py-1 text-[11px] font-semibold text-[#22714d] dark:border-[#27433e] dark:bg-[#17342f] dark:text-[#9ad0c1]">
                      Return {formatDate(job.estimated_return ?? null)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </PageShell>
  )
}

function SalesDashboard({
  name,
  salesToday,
  salesCount,
  lowStockCount,
  availableParts,
  recentSales,
}: {
  name: string
  salesToday: number
  salesCount: number
  lowStockCount: number
  availableParts: Part[]
  recentSales: Sale[]
}) {
  return (
    <PageShell>
      <DashboardHeader name={name} role="salesperson" />

      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sales Today" value={formatCurrency(salesToday)} icon={ShoppingCart} color="green" subtitle="Cash and card sales" />
        <StatCard title="Transactions" value={salesCount} icon={ClipboardList} color="blue" subtitle="Completed checkouts" />
        <StatCard title="Available Parts" value={availableParts.length} icon={Package} color="orange" subtitle="Ready to sell" />
        <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color={lowStockCount > 0 ? 'red' : 'green'} subtitle="Needs replenishment" />
      </div>

      <QuickActions role="salesperson" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Fast-moving parts" icon={Package} action={{ href: '/inventory', label: 'Open stock' }}>
          <PartsSnapshot parts={availableParts} />
        </Panel>
        <Panel title="Recent sales" icon={ShoppingCart} action={{ href: '/sales', label: 'Open POS' }}>
          <SalesList sales={recentSales} />
        </Panel>
      </div>
    </PageShell>
  )
}

export default async function DashboardPage() {
  const user = await requireUser()

  if (user.role === 'mechanic') {
    const data = await getMechanicDashboardData(user.id)
    return <MechanicDashboard name={data.profile?.full_name ?? user.full_name} activeJobs={data.activeJobs} completedToday={data.completedToday} />
  }

  if (user.role === 'salesperson') {
    const data = await getSalesDashboardData(user.id)
    return <SalesDashboard name={user.full_name} {...data} />
  }

  const [data, salesData] = await Promise.all([
    getDashboardData(user.id),
    getSalesDashboardData(),
  ])

  return (
    <AdminDashboard
      name={data.profile?.full_name ?? user.full_name}
      stats={data.stats}
      upcomingJobs={data.upcomingJobs}
      overdueJobs={data.overdueJobs}
      recentJobs={data.recentJobs}
      salesToday={salesData.salesToday}
      salesCount={salesData.salesCount}
    />
  )
}
