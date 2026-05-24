import { StatCard } from '@/components/dashboard/stat-card'
import {
  Car, Package, Clock, AlertTriangle,
  ClipboardList, UserPlus, CalendarClock, PlusCircle,
} from 'lucide-react'
import { formatDate, JOB_STATUS_COLORS, cn } from '@/lib/utils'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getDashboardData } from '@/lib/data'

const QUICK_ACTIONS = [
  {
    href: '/job-cards/new',
    label: 'New Job Card',
    description: 'Start a repair order',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-blue-600',
    ring: 'focus:ring-blue-500',
  },
  {
    href: '/customers/new',
    label: 'Add Customer',
    description: 'Register a new client',
    icon: UserPlus,
    gradient: 'from-emerald-500 to-emerald-600',
    ring: 'focus:ring-emerald-500',
  },
  {
    href: '/inventory/new',
    label: 'Add Part',
    description: 'Stock a new item',
    icon: PlusCircle,
    gradient: 'from-violet-500 to-violet-600',
    ring: 'focus:ring-violet-500',
  },
  {
    href: '/return-dates',
    label: 'Return Calendar',
    description: 'View scheduled returns',
    icon: CalendarClock,
    gradient: 'from-amber-500 to-amber-600',
    ring: 'focus:ring-amber-500',
  },
]

export default async function DashboardPage() {
  const user = await requireUser()
  const { profile, stats, upcomingJobs, overdueJobs, recentJobs } = await getDashboardData(user.id)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? null
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 font-normal">{today}</p>
        </div>
        <span className="hidden md:inline-flex shrink-0 text-xs font-medium text-slate-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
          Azim Motors · Garage Management
        </span>
      </div>

      {/* ── KPI Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard title="Cars In Service" value={stats.carsInService} icon={Car} color="blue" subtitle="Currently in workshop" />
        <StatCard title="Pending Jobs" value={stats.pendingJobs} icon={Clock} color="orange" subtitle="Awaiting start" />
        <StatCard title="Low Stock Parts" value={stats.lowStockCount} icon={Package} color="amber" subtitle="Need reorder" />
        <StatCard title="Overdue Returns" value={overdueJobs?.length ?? 0} icon={AlertTriangle} color={overdueJobs?.length ? 'red' : 'green'} subtitle="Past estimated date" />
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Quick Actions</p>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map(({ href, label, description, icon: Icon, gradient, ring }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-2.5 bg-white rounded-xl border border-gray-200/80 shadow-sm',
                'px-3 py-3 sm:px-4 sm:py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2', ring,
              )}
            >
              <div className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm flex-shrink-0',
                gradient,
              )}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-tight">{label}</p>
                <p className="hidden sm:block text-xs text-slate-400 truncate mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Upcoming Returns + Overdue Jobs ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Upcoming Returns */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">Upcoming Returns</h2>
            </div>
            <Link href="/return-dates" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
              View calendar
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingJobs?.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarClock className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No upcoming returns scheduled</p>
              </div>
            ) : upcomingJobs?.map(job => (
              <Link
                key={job.id}
                href={`/job-cards/${job.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {job.vehicles?.registration}
                    <span className="font-normal text-slate-300 mx-1">·</span>
                    {job.customers?.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{job.job_number}</p>
                </div>
                <span className="ml-3 shrink-0 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {formatDate(job.estimated_return)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Overdue Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">Overdue Jobs</h2>
              {!!overdueJobs?.length && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                  {overdueJobs.length}
                </span>
              )}
            </div>
            <Link href="/job-cards?filter=overdue" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {overdueJobs?.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <AlertTriangle className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No overdue jobs — great work!</p>
              </div>
            ) : overdueJobs?.slice(0, 5).map(job => (
              <Link
                key={job.id}
                href={`/job-cards/${job.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {job.vehicles?.registration}
                    <span className="font-normal text-slate-300 mx-1">·</span>
                    {job.customers?.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{job.job_number}</p>
                </div>
                <span className="ml-3 shrink-0 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  Due {formatDate(job.estimated_return)}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Recent Job Cards ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">Recent Job Cards</h2>
          </div>
          <Link href="/job-cards" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Job #</th>
                <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vehicle</th>
                <th className="hidden md:table-cell px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Complaint</th>
                <th className="px-3 sm:px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentJobs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                    No job cards yet — create your first one above.
                  </td>
                </tr>
              )}
              {recentJobs?.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/job-cards/${job.id}`} className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                      {job.job_number}
                    </Link>
                    <p className="sm:hidden text-[10px] text-slate-400 mt-0.5">{job.customers?.full_name}</p>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-700 font-medium">{job.customers?.full_name}</td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                      {job.vehicles?.registration}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{job.complaint}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap',
                      JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS],
                    )}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
