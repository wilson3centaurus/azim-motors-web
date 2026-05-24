import { Bell, CalendarDays } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileMenuButton } from '@/components/layout/mobile-menu-button'
import { requireUser } from '@/lib/auth'

export async function Topbar({ title }: { title?: string }) {
  const profile = await requireUser()

  const initials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="sticky top-2 z-20 flex shrink-0 items-start justify-between gap-2 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-3 py-2.5 shadow-[0_22px_60px_-42px_rgba(15,36,33,0.45)] backdrop-blur-xl sm:items-center sm:gap-3 sm:px-5 sm:py-3 lg:top-4 lg:border-[color-mix(in_srgb,var(--line)_82%,transparent)]">
      <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-3">
        <MobileMenuButton />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4e9b8e] dark:text-[#9ad0c1] sm:text-[11px] sm:tracking-[0.22em]">Operations Desk</p>
          <h1 className="truncate font-display text-base font-bold leading-tight text-[var(--text-strong)] sm:text-lg">{title ?? 'Hazim Motors Control Room'}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-center sm:gap-2">
        <div className="hidden items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-medium text-[var(--text-base)] md:flex">
          <CalendarDays className="h-4 w-4 text-[#d86f45]" />
          {today}
        </div>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-raised)] p-2.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-1 focus:ring-offset-transparent sm:inline-flex"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-raised)] px-1.5 py-1.5 sm:px-2 sm:py-2 sm:pl-2.5 sm:pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1f5f59] text-[10px] font-bold text-white shadow-[0_18px_28px_-20px_rgba(31,95,89,0.8)] sm:h-9 sm:w-9 sm:text-[11px]">
            {initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-semibold leading-none text-[var(--text-strong)]">{profile.full_name}</p>
            <p className="mt-0.5 text-[10px] capitalize text-[var(--text-muted)]">{profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
