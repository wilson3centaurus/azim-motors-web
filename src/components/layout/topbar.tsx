import { createClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileMenuButton } from '@/components/layout/mobile-menu-button'

export async function Topbar({ title }: { title?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user?.id ?? '')
    .single()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  return (
    <header className="h-12 bg-white border-b border-gray-100 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] flex items-center justify-between px-4 sm:px-5 sticky top-0 z-20 flex-shrink-0 gap-3">

      {/* Left — hamburger + optional title */}
      <div className="flex items-center gap-2 min-w-0">
        <MobileMenuButton />
        {title && (
          <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        )}
      </div>

      {/* Right — actions + user */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 ml-0.5 pl-2.5 border-l border-gray-100">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-none">{profile?.full_name}</p>
            <p className="text-[10px] text-slate-400 capitalize mt-0.5">{profile?.role}</p>
          </div>
        </div>
      </div>

    </header>
  )
}
