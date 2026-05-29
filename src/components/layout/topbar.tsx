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
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-card)] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:top-0 lg:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileMenuButton />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[15px] font-semibold leading-tight text-[var(--text-strong)] sm:text-base">{title ?? 'Hazin Motors'}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] md:flex">
          <CalendarDays className="h-3.5 w-3.5 text-[#1754af]" />
          {today}
        </div>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="hidden rounded-md border border-[var(--line)] bg-[var(--surface-raised)] p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] focus:outline-none sm:inline-flex"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-raised)] px-2 py-1.5 sm:pl-2.5 sm:pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1754af] text-[10px] font-bold text-white sm:h-8 sm:w-8">
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
