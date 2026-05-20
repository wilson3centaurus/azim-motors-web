'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import {
  LayoutDashboard, ClipboardList, Package, History,
  CalendarClock, Users, FileBarChart2, Settings, LogOut, Wrench, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

  /* Close drawer on every route change */
  useEffect(() => { close() }, [pathname, close])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
          'fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-100 flex flex-col z-30',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo + close btn */}
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-gray-100 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-none tracking-tight">Azim Motors</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Garage System</p>
          </div>
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.1em] px-2.5 mb-1.5">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ href, label: itemLabel, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150',
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800',
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-[15px] h-[15px] flex-shrink-0',
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500',
                        )}
                      />
                      {itemLabel}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-2.5 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700 w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <LogOut className="w-[15px] h-[15px] flex-shrink-0" />
            Sign out
          </button>
        </div>

      </aside>
    </>
  )
}
