'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'

export function MobileMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
