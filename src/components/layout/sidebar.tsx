'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { LayoutDashboard, ClipboardList, Package, History, CalendarClock, Users, FileBarChart2, Settings, LogOut, Wrench, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

function getNavGroups(role: UserRole) {
  if (role === 'salesperson') {
    return [
      {
        label: 'Main',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/sales', label: 'POS Sales', icon: ClipboardList },
        ],
      },
      {
        label: 'Stock',
        items: [
          { href: '/inventory', label: 'Inventory', icon: Package },
          { href: '/customers', label: 'Customers', icon: Users },
        ],
      },
      {
        label: 'Manage',
        items: [
          { href: '/settings', label: 'Settings', icon: Settings },
        ],
      },
    ]
  }

  if (role === 'mechanic') {
    return [
      {
        label: 'Main',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/job-cards', label: 'Job Cards', icon: ClipboardList },
        ],
      },
      {
        label: 'Workshop',
        items: [
          { href: '/repair-records', label: 'Repair Records', icon: History },
          { href: '/return-dates', label: 'Return Dates', icon: CalendarClock },
          { href: '/customers', label: 'Customers', icon: Users },
        ],
      },
      {
        label: 'Manage',
        items: [
          { href: '/settings', label: 'Settings', icon: Settings },
        ],
      },
    ]
  }

  return [
    {
      label: 'Main',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/job-cards', label: 'Job Cards', icon: ClipboardList },
        { href: '/sales', label: 'POS Sales', icon: ClipboardList },
      ],
    },
    {
      label: 'Workshop',
      items: [
        { href: '/inventory', label: 'Inventory', icon: Package },
        { href: '/repair-records', label: 'Repair Records', icon: History },
        { href: '/return-dates', label: 'Return Dates', icon: CalendarClock },
      ],
    },
    {
      label: 'People',
      items: [
        { href: '/customers', label: 'Customers', icon: Users },
        { href: '/settings/users', label: 'Employees', icon: Users },
      ],
    },
    {
      label: 'Manage',
      items: [
        { href: '/reports', label: 'Reports', icon: FileBarChart2 },
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ]
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const { open, close } = useSidebar()
  const router = useRouter()
  const [loggingOut, startLogout] = useTransition()
  const navGroups = getNavGroups(role)

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
          'fixed inset-y-0 left-0 z-30 flex w-[min(var(--sidebar-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-r border-[var(--line)] bg-[var(--surface-raised)] shadow-[4px_0_24px_-8px_rgba(0,0,0,0.08)]',
          'lg:bottom-0 lg:left-0 lg:top-0 lg:rounded-none lg:border-r lg:w-[var(--sidebar-width)]',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="border-b border-[var(--line)] bg-[var(--surface-card)] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Image
                src="/hazin-motors-logo.png"
                alt="Hazin Motors"
                width={150}
                height={50}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="lg:hidden rounded-md p-1.5 text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                {label}
              </p>
              <div className="mt-1 space-y-0.5">
                {items.map(({ href, label: itemLabel, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all duration-150',
                        active
                          ? 'bg-[var(--surface-accent-soft)] text-[#1754af] shadow-[0_2px_8px_-4px_rgba(23,84,175,0.3)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-strong)]',
                      )}
                    >
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors', active ? 'bg-[#1754af] text-white' : 'text-[var(--text-soft)] group-hover:text-[var(--text-muted)]')}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-medium">{itemLabel}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--line)] px-3 pb-4 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-soft)] hover:text-[var(--danger)] focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-soft)]">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  )
}
