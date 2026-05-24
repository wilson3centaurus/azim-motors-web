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
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 rounded-[28px] border border-white/60 bg-white/78 px-4 py-3 shadow-[0_22px_60px_-42px_rgba(15,36,33,0.45)] backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenuButton />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f5f59]">Operations Desk</p>
          <h1 className="truncate font-display text-lg font-bold text-slate-900">{title ?? 'Azim Motors Control Room'}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-2xl border border-[#e6ddd2] bg-[#f7f1e5] px-3 py-2 text-xs font-medium text-slate-700 md:flex">
          <CalendarDays className="h-4 w-4 text-[#d86f45]" />
          {today}
        </div>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-2xl border border-[#e6ddd2] bg-white/90 p-2.5 text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-1"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-[#e6ddd2] bg-white/90 px-2 py-2 sm:pl-2.5 sm:pr-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f5f59] text-[11px] font-bold text-white shadow-[0_18px_28px_-20px_rgba(31,95,89,0.8)]">
            {initials}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-semibold leading-none text-slate-900">{profile.full_name}</p>
            <p className="mt-0.5 text-[10px] capitalize text-slate-400">{profile.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
