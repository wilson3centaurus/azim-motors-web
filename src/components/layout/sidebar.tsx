'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { LayoutDashboard, ClipboardList, Package, History, CalendarClock, Users, FileBarChart2, Settings, LogOut, Wrench, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
      { href: '/job-cards',      label: 'Job Cards',      icon: ClipboardList },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { href: '/inventory',      label: 'Inventory',      icon: Package },
      { href: '/repair-records', label: 'Repair Records', icon: History },
      { href: '/return-dates',   label: 'Return Dates',   icon: CalendarClock },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/customers',      label: 'Customers',      icon: Users },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/reports',        label: 'Reports',        icon: FileBarChart2 },
      { href: '/settings',       label: 'Settings',       icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, close } = useSidebar()
  const router = useRouter()
  const [loggingOut, startLogout] = useTransition()

  /* Close drawer on every route change */
  useEffect(() => { close() }, [pathname, close])

  async function handleLogout() {
    startLogout(async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      const result = await response.json()

      router.push(result.redirectTo ?? '/login')
      router.refresh()
    })
  }

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────── */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ───────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[var(--sidebar-width)] flex-col overflow-hidden border-r border-white/70 bg-[rgba(255,255,255,0.86)] shadow-[0_30px_80px_-48px_rgba(15,36,33,0.7)] backdrop-blur-xl',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="border-b border-black/5 px-5 pb-5 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f5f59] shadow-[0_18px_30px_-18px_rgba(31,95,89,0.7)]">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold tracking-tight text-slate-900">Azim Motors</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Compact garage control for front desk and workshop staff.</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="lg:hidden rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 rounded-[22px] border border-[#e6ddd2] bg-[#f6efe3] p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f5f59]">Today</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Stay on top of check-ins, live jobs, and low-stock parts.</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                {label}
              </p>
              <div className="mt-2 space-y-1">
                {items.map(({ href, label: itemLabel, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-3 text-[13px] transition-all duration-150',
                        active
                          ? 'bg-[#e9f5f2] text-[#184944] shadow-[0_18px_35px_-24px_rgba(24,73,68,0.45)]'
                          : 'text-slate-500 hover:bg-white/80 hover:text-slate-800',
                      )}
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors', active ? 'bg-white text-[#1f5f59]' : 'bg-[#f2eee7] text-slate-500 group-hover:bg-white')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{itemLabel}</p>
                        <p className="truncate text-[11px] text-slate-400">Open {itemLabel.toLowerCase()}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-black/5 px-3 pb-4 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:bg-white/80 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2eee7] text-slate-500">
              <LogOut className="h-4 w-4" />
            </div>
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  )
}
