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
          'fixed inset-y-0 left-0 z-30 flex w-[min(var(--sidebar-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-r border-[var(--line-soft)] bg-[var(--surface-panel)] shadow-[0_30px_80px_-48px_rgba(15,36,33,0.7)] backdrop-blur-xl',
          'lg:bottom-4 lg:left-4 lg:top-4 lg:rounded-xl lg:border lg:border-[var(--line)] lg:w-[calc(var(--sidebar-width)-1rem)]',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="border-b border-[var(--line)] px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Image
                src="/hazin-motors-logo.png"
                alt="Hazin Motors"
                width={160}
                height={54}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="lg:hidden rounded-xl p-2 text-[var(--text-soft)] transition-colors hover:bg-[var(--surface-card)] hover:text-[var(--text-strong)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4 sm:px-3">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-soft)]">
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
                        'group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] transition-all duration-150',
                        active
                          ? 'bg-[var(--surface-accent-soft)] text-[var(--accent-strong)] shadow-[0_18px_35px_-24px_rgba(24,73,68,0.45)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-strong)]',
                      )}
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors', active ? 'bg-[var(--surface-raised)] text-[#1f5f59]' : 'bg-[var(--surface-soft)] text-[var(--text-muted)] group-hover:bg-[var(--surface-raised)]')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-tight">{itemLabel}</p>
                        <p className="truncate text-[11px] text-[var(--text-soft)]">Open {itemLabel.toLowerCase()}</p>
                      </div>
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
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[13px] font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-raised)] hover:text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-1 focus:ring-offset-transparent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]">
              <LogOut className="h-4 w-4" />
            </div>
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>
    </>
  )
}
